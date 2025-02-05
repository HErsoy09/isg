async function loadData() {
    const response = await fetch('data/nace.json');
    return await response.json();
}

async function searchData() {
    const searchInput = document.getElementById("searchInput").value;
    const resultDiv = document.getElementById("result");
    const data = await loadData();
    const foundData = data.find(item => item.NACE === searchInput);

    if (foundData) {
        resultDiv.innerHTML = `<p><strong>Açıklama:</strong> ${foundData.Tanım}</p><p><strong>Tehlike Sınıfı:</strong> ${foundData["Tehlike Sınıfı"]}</p>`;
    } else {
        resultDiv.innerHTML = "<p>Veri bulunamadı.</p>";
    }
}
