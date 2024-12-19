document.addEventListener("DOMContentLoaded", () => {
    const rekeningSelect = document.getElementById("rekeningSelect");
    const saldoDisplay = document.getElementById("saldoDisplay");
    const transactionList = document.getElementById("transaction-list");
    const bedragInput = document.getElementById("bedragInput");
    const toevoegenButton = document.getElementById("toevoegen");
    const afnemenButton = document.getElementById("afnemen");
    const naarRekeningSelect = document.getElementById("naarRekeningSelect");
    const overschrijvingBedrag = document.getElementById("overschrijvingBedrag");
    const overschrijvenButton = document.getElementById("overschrijven");
    const rekeningTableBody = document.querySelector("#rekeningTable tbody");
    const saldoSortering = document.getElementById("saldoSortering");

    const rekeningenKey = "rekeningen";
    const transactiesKey = "transacties";
    let rekeningen = JSON.parse(localStorage.getItem(rekeningenKey)) || {};
    let transacties = JSON.parse(localStorage.getItem(transactiesKey)) || {};

    // Vul de rekeningen in de tabel
    function vulRekeningTabel() {
        rekeningTableBody.innerHTML = "";
        
        // Sorteer de rekeningen op saldo
        const sorteerOp = saldoSortering.value;
        let rekeningenArray = Object.entries(rekeningen);
        if (sorteerOp === "hoogste") {
            rekeningenArray = rekeningenArray.sort((a, b) => b[1] - a[1]);
        } else {
            rekeningenArray = rekeningenArray.sort((a, b) => a[1] - b[1]);
        }

        // Vul de tabel met rekeninginformatie en de laatste 3 transacties
        rekeningenArray.forEach(([rekeningNaam, saldo]) => {
            const row = document.createElement("tr");

            const naamCel = document.createElement("td");
            naamCel.textContent = rekeningNaam;

            const saldoCel = document.createElement("td");
            saldoCel.textContent = `€${saldo.toFixed(2)}`;

            const transactiesCell = document.createElement("td");
            const rekeningTransacties = transacties[rekeningNaam] || [];
            const laatsteDrieTransacties = rekeningTransacties.slice(-3);
            laatsteDrieTransacties.forEach(transactie => {
                const transactieElement = document.createElement("div");
                transactieElement.innerHTML = `${transactie.type} €${transactie.bedrag.toFixed(2)} <small>(${new Date(transactie.datum).toLocaleString()})</small>`;
                transactiesCell.appendChild(transactieElement);
            });

            row.appendChild(naamCel);
            row.appendChild(saldoCel);
            row.appendChild(transactiesCell);

            rekeningTableBody.appendChild(row);
        });
    }

    saldoSortering.addEventListener("change", vulRekeningTabel);

    // Update het rekeningselect-menu
    function updateRekeningenSelect() {
        rekeningSelect.innerHTML = "";
        for (let rekening in rekeningen) {
            const option = document.createElement("option");
            option.value = rekening;
            option.textContent = rekening;
            rekeningSelect.appendChild(option);
        }
        if (rekeningSelect.options.length > 0) {
            rekeningSelect.value = rekeningSelect.options[0].value;
            updateSaldoDisplay();
            updateNaarRekeningSelect();
        }
        vulRekeningTabel();
    }

    // Update het saldo van de geselecteerde rekening
    function updateSaldoDisplay() {
        const huidigeRekening = rekeningSelect.value;
        saldoDisplay.textContent = `€${(rekeningen[huidigeRekening] || 0).toFixed(2)}`;
        updateTransactionList();
    }

    // Toon de transacties van de geselecteerde rekening
    function updateTransactionList() {
        const huidigeRekening = rekeningSelect.value;
        const rekeningTransacties = transacties[huidigeRekening] || [];
        transactionList.innerHTML = "";
        rekeningTransacties.forEach(transactie => {
            const li = document.createElement("li");
            li.textContent = `${transactie.type} €${transactie.bedrag.toFixed(2)} - ${new Date(transactie.datum).toLocaleString()}`;
            transactionList.appendChild(li);
        });
    }

    // Voeg een nieuwe rekening toe
    document.getElementById("nieuweRekening").addEventListener("click", () => {
        const naam = prompt("Voer de naam van de nieuwe rekening in:");
        if (naam && !rekeningen[naam]) {
            rekeningen[naam] = 0;
            transacties[naam] = [];
            localStorage.setItem(rekeningenKey, JSON.stringify(rekeningen));
            localStorage.setItem(transactiesKey, JSON.stringify(transacties));
            updateRekeningenSelect();
        } else {
            alert("Rekening naam al in gebruik.");
        }
    });

    // Verwerk het toevoegen of afnemen van bedrag
    function verwerkTransactie(type) {
        const bedrag = parseFloat(bedragInput.value);
        if (isNaN(bedrag) || bedrag <= 0) {
            alert("Voer een geldig bedrag in.");
            return;
        }

        const geselecteerdeRekening = rekeningSelect.value;
        if (type === "toevoegen") {
            rekeningen[geselecteerdeRekening] += bedrag;
        } else if (type === "afnemen") {
            if (rekeningen[geselecteerdeRekening] < bedrag) {
                alert("Onvoldoende saldo.");
                return;
            }
            rekeningen[geselecteerdeRekening] -= bedrag;
        }

        const transactie = {
            type: type === "toevoegen" ? "Toegevoegd" : "Afgenomen",
            bedrag,
            datum: new Date().toISOString()
        };

        // Voeg transactie toe aan het logboek
        if (!transacties[geselecteerdeRekening]) {
            transacties[geselecteerdeRekening] = [];
        }
        transacties[geselecteerdeRekening].push(transactie);

        localStorage.setItem(rekeningenKey, JSON.stringify(rekeningen));
        localStorage.setItem(transactiesKey, JSON.stringify(transacties));
        updateSaldoDisplay();
        updateTransactionList();
        vulRekeningTabel();
    }

    // Event Listeners voor toevoegen of afnemen
    toevoegenButton.addEventListener("click", () => verwerkTransactie("toevoegen"));
    afnemenButton.addEventListener("click", () => verwerkTransactie("afnemen"));

    // Overschrijving
    overschrijvenButton.addEventListener("click", () => {
        const bedrag = parseFloat(overschrijvingBedrag.value);
        if (isNaN(bedrag) || bedrag <= 0) {
            alert("Voer een geldig bedrag in.");
            return;
        }
        const vanRekening = rekeningSelect.value;
        const naarRekening = naarRekeningSelect.value;
        if (rekeningen[vanRekening] < bedrag) {
            alert("Onvoldoende saldo.");
            return;
        }
        rekeningen[vanRekening] -= bedrag;
        rekeningen[naarRekening] += bedrag;

        // Voeg transacties toe voor beide rekeningen
        transacties[vanRekening].push({
            type: "Overschrijving Af",
            bedrag,
            datum: new Date().toISOString()
        });
        transacties[naarRekening].push({
            type: "Overschrijving Naar",
            bedrag,
            datum: new Date().toISOString()
        });

        localStorage.setItem(rekeningenKey, JSON.stringify(rekeningen));
        localStorage.setItem(transactiesKey, JSON.stringify(transacties));
        updateSaldoDisplay();
        updateTransactionList();
        vulRekeningTabel();
    });

    updateRekeningenSelect();
});
