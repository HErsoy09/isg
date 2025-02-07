// script.js
const SHEET_URL = config.FIRMA_TAKIP_GOOGLE_SCRIPT_URL;


// NACE verilerini yükleme
async function loadDataNACE() {
	try {
		console.log('NACE verisi yükleniyor...'); // Debug log
		const response = await fetch('/data/nace.json');
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		console.log('NACE verisi yüklendi:', data); // Debug log
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
		return await response.json();

	} catch (error) {
		console.error('Firma veri yükleme hatası:', error);
		return [];
	}
}


// NACE arama fonksiyonu
async function searchNACE() {
	const searchInput = document.getElementById("naceInput").value.toLowerCase();
	const resultDiv = document.getElementById("naceResult");

	console.log('Arama başladı:', searchInput); // Debug log

	if (!searchInput.trim()) {
		resultDiv.classList.remove('visible');
		return;
	}

	try {
		const data = await loadDataNACE();
		console.log('Filtreleme öncesi veri sayısı:', data.length); // Debug log

		const foundData = data.filter(item =>
			item.NACE.toLowerCase().includes(searchInput) ||
			item.Tanım.toLowerCase().includes(searchInput)
		);

		console.log('Bulunan sonuç sayısı:', foundData.length); // Debug log

		if (foundData.length === 0) {
			resultDiv.innerHTML = `
				<div class="no-results">
					<i class="fas fa-search"></i>
					<p>Aradığınız kriterlere uygun sonuç bulunamadı.</p>
				</div>
			`;
		}

		if (foundData.length > 0) {
			let resultsHtml = `
                <table class="result-table">
                    <thead>
                        <tr>
                            <th>NACE Kodu</th>
                            <th>Açıklama</th>
                            <th>Tehlike Sınıfı</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

			foundData.forEach(item => {
				const tehlikeSinifi = item["Tehlike Sınıfı"] || '-';
				const tehlikeSinifiClass = getTehlikeSinifiClass(tehlikeSinifi);

				resultsHtml += `
					<tr>
						<td>${item.NACE}</td>
						<td>${item.Tanım}</td>
						<td>
							<span class="tehlike-sinifi ${tehlikeSinifiClass}">
								${tehlikeSinifi}
							</span>
						</td>
					</tr>
				`;
			});

			resultsHtml += `</tbody></table>`;
			resultDiv.innerHTML = resultsHtml;
			resultDiv.classList.add('visible');

			console.log('Sonuçlar görüntülendi'); // Debug log
		} else {
			resultDiv.innerHTML = `
                <div class="no-results">
                    <p>Sonuç bulunamadı.</p>
                </div>
            `;
			resultDiv.classList.add('visible');
		}
		
	} catch (error) {
		console.error('Arama hatası:', error); // Debug log
		resultDiv.innerHTML = `
            <div class="error-message">
                <p>Arama sırasında bir hata oluştu.</p>
            </div>
        `;
		resultDiv.classList.add('visible');
	}
}

// Tehlike sınıfı için CSS class belirleme
function getTehlikeSinifiClass(tehlikeSinifi) {
	switch (tehlikeSinifi.toLowerCase()) {
		case 'az tehlikeli':
			return 'az';
		case 'tehlikeli':
			return 'tehlikeli';
		case 'çok tehlikeli':
			return 'cok';
		default:
			return '';
	}
}

// Input placeholder'ı güncelle
document.getElementById("naceInput").placeholder = "NACE kodu veya açıklama giriniz (Örn: 01.11.07 veya baklagil)";


// Firma arama fonksiyonu
async function searchFirma() {
	const sozlesme = document.getElementById("sozlesmeSelect").value;
	const firmaAdi = document.getElementById("firmaAdi").value.toLowerCase();
	const sgkNo = document.getElementById("sgkNo").value;
	const yetkiliAdi = document.getElementById("yetkiliAdi").value.toLowerCase();

	const resultDiv = document.getElementById("firmaResult");

	// Tüm inputlar boşsa result'ı gizle
	if (!sozlesme && !firmaAdi && !sgkNo && !yetkiliAdi) {
		resultDiv.style.opacity = '0';
		setTimeout(() => {
			resultDiv.classList.remove('visible');
			resultDiv.innerHTML = '';
		}, 300);
		return;
	}

	// Loading göster
	resultDiv.classList.add('visible');
	resultDiv.innerHTML = `
        <div class="loading-container fade-in-up">
            <div class="loading-spinner"></div>
            <div class="loading-text">Firmalar aranıyor...</div>
        </div>
    `;

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
			setTimeout(() => {
				displayFirmaResults(filteredData);
				resultDiv.classList.add('visible', 'fade-in-up');
			}, 500);
		} else {
			setTimeout(() => {
				resultDiv.innerHTML = `
                    <div class="no-results fade-in-up">
                        <i class="fas fa-search"></i>
                        <p>Firma bulunamadı.</p>
                    </div>
                `;
				resultDiv.classList.add('visible');
			}, 500);
		}
	} catch (error) {
		setTimeout(() => {
			resultDiv.innerHTML = `
                <div class="error-message fade-in-up">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Firma sorgulama hatası oluştu.</p>
                </div>
            `;
			resultDiv.classList.add('visible');
		}, 500);
		console.error('Firma arama hatası:', error);
	}
}


// Firma sonuçlarını görüntüleme
function displayFirmaResults(data) {
	const resultDiv = document.getElementById("firmaResult");

	// Ana container'ları oluştur
	resultDiv.innerHTML = `
        <div class="table-container">
            <table class="result-table">
                <thead>
                    <tr>
                        <th>İSG-KATİP</th>
                        <th>Firma Adı</th>
                        <th>SGK No</th>
                        <th>İl</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map((item, index) => `
                        <tr>
                            <td data-status="${item.SozlesmeGirisiYapildiMi}">
                                ${item.SozlesmeGirisiYapildiMi ? 'Yapıldı' : 'Yapılmadı'}
                            </td>
                            <td>${item["Firma Adı"] || '-'}</td>
                            <td class="sgk-no">${item["SGK İşyeri Sicil No"] || '-'}</td>
                            <td>${item["İşyeri Adresi (İl)"] || '-'}</td>
                            <td class="action-cell">
                                <button class="detaylar-btn" onclick="showFirmaDetay(${index})">
                                    Detaylar <i class="fas fa-chevron-right"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div id="firmaDetay" class="firma-detay"></div>
    `;

	// Global değişkene veriyi kaydet
	window.firmaData = data;

	// Sonuçlara scroll
	requestAnimationFrame(() => {
		scrollToElement(resultDiv);
	});
}

// Firma detaylarını görüntüleme
function showFirmaDetay(index) {
	const firma = window.firmaData[index];
	if (!firma) return;

	const detayDiv = document.getElementById('firmaDetay');

	// Telefon numarasını güvenli bir şekilde işle
	const phoneNumber = firma["Yetkili Telefon No"];
	const formattedPhone = phoneNumber ? String(phoneNumber).replace(/\D/g, '') : '';

	detayDiv.innerHTML = `
        <div class="firma-detay-grid">
            <div class="detay-grup">
                <h3>${firma["Firma Adı"] || 'İsimsiz Firma'}</h3>
                <div class="detay-label">SGK No</div>
                <div class="detay-value">${firma["SGK İşyeri Sicil No"] || '-'}</div>
            </div>
            
            <div class="detay-grup">
                <div class="detay-label">Yetkili Bilgileri</div>
                <div class="detay-value">
                    <p>${firma["Yetkili Adı, Soyadı"] || '-'}</p>
                    ${phoneNumber ? `
                        <div class="contact-links">
                            <a href="tel:${phoneNumber}" class="contact-link">
                                <i class="fas fa-phone"></i>
                                ${phoneNumber}
                            </a>
                            ${formattedPhone ? `
                                <a href="https://wa.me/${formattedPhone}" 
                                   class="contact-link" 
                                   target="_blank">
                                    <i class="fab fa-whatsapp"></i>
                                    WhatsApp
                                </a>
                            ` : ''}
                        </div>
                    ` : '-'}
                </div>
            </div>

            <div class="detay-grup">
                <div class="detay-label">Adres Bilgileri</div>
                <div class="detay-value">
                    ${firma["İşyeri Adresi (İl)"] || '-'}/${getIlce(firma) || '-'}
                </div>
            </div>

            <div class="detay-grup">
                <div class="detay-label">İSG Profesyonelleri</div>
                <div class="detay-value">
                    <p><strong>İGU:</strong> ${firma["iguName"] || '-'}</p>
                    <p><strong>İH:</strong> ${firma["ihName"] || '-'}</p>
                    <p><strong>DSP:</strong> ${firma["dspName"] || '-'}</p>
                </div>
            </div>

            <div class="detay-grup">
                <div class="detay-label">Diğer Bilgiler</div>
                <div class="detay-value">
                    <p><strong>Tehlike Sınıfı:</strong> ${firma["Tehlike Sınıfı"] || '-'}</p>
                    <p><strong>İSG-KATİP Durumu:</strong> 
                        <span class="${firma.SozlesmeGirisiYapildiMi ? 'status-success' : 'status-danger'}">
                            ${firma.SozlesmeGirisiYapildiMi ? 'Yapıldı' : 'Yapılmadı'}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    `;

	// Animasyon ve scroll
	requestAnimationFrame(() => {
		detayDiv.classList.add('active');
		scrollToElement(detayDiv);
		highlightElement(detayDiv);
	});
}

// Scroll helper fonksiyonu
function scrollToElement(element) {
	const headerHeight = document.querySelector('header')?.offsetHeight || 60;
	const offset = 20;
	const elementPosition = element.getBoundingClientRect().top;
	const offsetPosition = elementPosition + window.pageYOffset - headerHeight - offset;

	window.scrollTo({
		top: offsetPosition,
		behavior: 'smooth'
	});
}

// Highlight helper fonksiyonu
function highlightElement(element) {
	element.style.backgroundColor = 'rgba(44, 62, 80, 0.95)';
	setTimeout(() => {
		element.style.transition = 'background-color 0.5s ease';
		element.style.backgroundColor = 'transparent';
	}, 800);
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

	// Result containerları gizle
	document.querySelectorAll('.result-container').forEach(container => {
		container.classList.remove('visible');
	});

	// Input temizlendiğinde result'ı gizle
	document.getElementById('naceInput')?.addEventListener('input', (e) => {
		if (!e.target.value.trim()) {
			document.getElementById('naceResult').classList.remove('visible');
		}
	});

	// Firma formu inputları temizlendiğinde result'ı gizle
	['sozlesmeSelect', 'firmaAdi', 'sgkNo', 'yetkiliAdi'].forEach(id => {
		document.getElementById(id)?.addEventListener('input', (e) => {
			const allEmpty = ['sozlesmeSelect', 'firmaAdi', 'sgkNo', 'yetkiliAdi']
				.every(id => !document.getElementById(id)?.value);
			if (allEmpty) {
				document.getElementById('firmaResult').classList.remove('visible');
			}
		});
	});


	// NACE arama için enter
	document.getElementById('naceInput')?.addEventListener('keypress', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			searchNACE();
		}
	});

	// Firma arama için tüm inputlara enter event'i ekle
	const firmaInputs = ['firmaAdi', 'sgkNo', 'yetkiliAdi'];
	firmaInputs.forEach(inputId => {
		document.getElementById(inputId)?.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				searchFirma();
			}
		});
	});

	// Select için change event'i
	document.getElementById('sozlesmeSelect')?.addEventListener('change', () => {
		searchFirma();
	});
});
