
export function showMessage(text) {
    const messageDiv = document.createElement("div");
    messageDiv.style.cssText = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px;opacity:1;transition:opacity 1s;";
    messageDiv.textContent = text;
    document.body.appendChild(messageDiv);
    setTimeout(() => {
        messageDiv.style.opacity = "0";
        setTimeout(() => document.body.removeChild(messageDiv), 1000);
    }, 3000);
}

let drowningMessage = null;

export function showDrowningMessage(text, isRed = false) {
    if (!drowningMessage) {
        drowningMessage = document.createElement("div");
        drowningMessage.style.cssText = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px;";
        document.body.appendChild(drowningMessage);
    }
    drowningMessage.textContent = text;
    drowningMessage.style.color = isRed ? "red" : "white";
}

export function removeDrowningMessage() {
    if (drowningMessage) {
        document.body.removeChild(drowningMessage);
        drowningMessage = null;
    }
}