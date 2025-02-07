// script.js
const SHEET_URL = config.FIRMA_TAKIP_GOOGLE_SCRIPT_URL;

// NACE verilerini yükleme
async function loadDataNACE() {
	try {
		const response = await fetch('data/nace.json');
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('NACE veri yükleme hatası:', error);
		return [];
	}
}

// Firma verilerini yükleme
async function loadDataFirma() {
	try {
		const response = await fetch(SHEET_URL);
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Firma veri yükleme hatası:', error);
		return [];
	}
}

// NACE arama fonksiyonu
async function searchNACE() {
	const searchInput = document.getElementById("naceInput").value;
	const resultDiv = document.getElementById("naceResult");

	try {
		const data = await loadDataNACE();
		const foundData = data.find(item => item.NACE === searchInput);

		if (foundData) {
			resultDiv.innerHTML = `
				<div class="result-box">
					<p><strong>NACE Kodu:</strong> ${foundData.NACE}</p>
					<p><strong>Açıklama:</strong> ${foundData.Tanım}</p>
					<p><strong>Tehlike Sınıfı:</strong> ${foundData["Tehlike Sınıfı"]}</p>
				</div>`;
		} else {
			resultDiv.innerHTML = "<p>NACE kodu bulunamadı.</p>";
		}
	} catch (error) {
		resultDiv.innerHTML = "<p>NACE sorgulamada hata oluştu.</p>";
		console.error('NACE arama hatası:', error);
	}
}

// Firma arama fonksiyonu
async function searchFirma() {
	const sozlesme = document.getElementById("sozlesmeSelect").value;
	const firmaAdi = document.getElementById("firmaAdi").value.toLowerCase();
	const sgkNo = document.getElementById("sgkNo").value;
	const yetkiliAdi = document.getElementById("yetkiliAdi").value.toLowerCase();

	const resultDiv = document.getElementById("firmaResult");

	try {
		const data = await loadDataFirma();

		let filteredData = data.filter(item => {
			const matchSozlesme = !sozlesme ||
				(sozlesme === "TRUE" && item.SozlesmeGirisiYapildiMi === true) ||
				(sozlesme === "FALSE" && item.SozlesmeGirisiYapildiMi === false);

			const matchFirma = !firmaAdi || item["Firma Adı"].toLowerCase().includes(firmaAdi);
			const matchSgk = !sgkNo || item["SGK İşyeri Sicil No"].includes(sgkNo);
			const matchYetkili = !yetkiliAdi || item["Yetkili Adı, Soyadı"].toLowerCase().includes(yetkiliAdi);

			return matchSozlesme && matchFirma && matchSgk && matchYetkili;
		});

		if (filteredData.length > 0) {
			let tableHtml = createTableHTML(filteredData);
			resultDiv.innerHTML = tableHtml;
		} else {
			resultDiv.innerHTML = "<p>Firma bulunamadı.</p>";
		}
	} catch (error) {
		resultDiv.innerHTML = "<p>Firma sorgulama hatası oluştu.</p>";
		console.error('Firma arama hatası:', error);
	}
}

// Tablo oluşturma fonksiyonu
function createTableHTML(data) {
	let tableHtml = `
		<table class="result-table">
			<thead>
				<tr>
					<th>İSG-KATİP Girişi</th>
					<th>Firma Adı</th>
					<th>Yetkili</th>
					<th>İletişim</th>
					<th>SGK No</th>
					<th>Tehlike Sınıfı</th>
					<th>İl</th>
					<th>İlçe</th>
					<th>İGU</th>
					<th>İH</th>
					<th>DSP</th>
				</tr>
			</thead>
			<tbody>
	`;

	data.forEach(item => {
		tableHtml += `
			<tr>
				<td>${item.SozlesmeGirisiYapildiMi === true ? 'Yapıldı' : 'Yapılmadı'}</td>
				<td>${item["Firma Adı"] || '-'}</td>
				<td>${item["Yetkili Adı, Soyadı"] || '-'}</td>
				<td>${item["Yetkili Telefon No"] || '-'}</td>
				<td>${item["SGK İşyeri Sicil No"] || '-'}</td>
				<td>${item["Tehlike Sınıfı"] || '-'}</td>
				<td>${item["İşyeri Adresi (İl)"] || '-'}</td>
				<td>${getIlce(item) || '-'}</td>
				<td>${item["iguName"] || '-'}</td>
				<td>${item["ihName"] || '-'}</td>
				<td>${item["dspName"] || '-'}</td>
			</tr>
		`;
	});

	return tableHtml + '</tbody></table>';
}

// İlçe bilgisi alma fonksiyonu
function getIlce(item) {
	return item["İşyeri Adresi (Aydın - İlçe)"] ||
		item["İşyeri Adresi (Denizli - İlçe)"] ||
		item["İşyeri Adresi (Muğla - İlçe)"] ||
		item["İşyeri Adresi (İzmir - İlçe)"] ||
		item["İşyeri Adresi (Manisa - İlçe)"];
}

// Event listener'ları ekle
document.addEventListener('DOMContentLoaded', () => {
	// Enter tuşu ile arama yapılabilmesi için
	document.getElementById('naceInput')?.addEventListener('keypress', (e) => {
		if (e.key === 'Enter') searchNACE();
	});

	document.getElementById('firmaAdi')?.addEventListener('keypress', (e) => {
		if (e.key === 'Enter') searchFirma();
	});
});