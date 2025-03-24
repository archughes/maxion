export function setupTooltip(element, contentGenerator) {
    element.addEventListener("mouseenter", (e) => {
        const tooltip = document.getElementById("tooltip");
        tooltip.innerHTML = contentGenerator();
        if (element.querySelector("svg")) {
            const iconClone = element.querySelector("svg").cloneNode(true);
            iconClone.style.width = "24px";
            iconClone.style.height = "24px";
            tooltip.insertBefore(iconClone, tooltip.firstChild);
        }
        tooltip.style.display = "block";
        positionTooltip(e, tooltip);
    });

    element.addEventListener("mousemove", (e) => positionTooltip(e, document.getElementById("tooltip")));
    element.addEventListener("mouseleave", () => document.getElementById("tooltip").style.display = "none");
    element.addEventListener("dragstart", () => document.getElementById("tooltip").style.display = "none");
}

export function positionTooltip(e, tooltip) {
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    let left = e.pageX + 10;
    let top = e.pageY + 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left + tooltipWidth > viewportWidth) left = e.pageX - tooltipWidth - 10;
    if (top + tooltipHeight > viewportHeight) top = e.pageY - tooltipHeight - 10;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}