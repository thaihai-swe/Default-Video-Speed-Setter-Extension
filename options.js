const speedInput = document.getElementById("speed");
const saveBtn = document.getElementById("save");
const status = document.getElementById("status");

chrome.storage.sync.get("defaultSpeed", ({ defaultSpeed }) => {
    speedInput.value = defaultSpeed || 1.25;
});

saveBtn.addEventListener("click", () => {
    const speed = parseFloat(speedInput.value);
    chrome.storage.sync.set({ defaultSpeed: speed }, () => {
        status.textContent = "Speed updated successfully!";
        setTimeout(() => { status.textContent = ""; }, 2000);
    });
});
