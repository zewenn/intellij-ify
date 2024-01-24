
/**
 * @typedef {Array.<number>} NumberList
 * @typedef {Array.<NumberList>} Matrix2D 
 */


/**
 * @type {Matrix2D}
 */
let colours = [
    [255, 122, 0],
    [221, 55, 235],
    [0, 178, 255],
    [0, 209, 255],
    [16, 79, 240],
    [98, 39, 240],
    [241, 39, 160],
    [56, 202, 88],
    [245, 162, 36],
    [255, 72, 14],
    [135, 97, 248]
]

/**
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

/**
 * @param {Array} array 
 */
function get_random_array_element(array) {
    return array[randomIntFromInterval(0, array.length - 1)]
}

window.addEventListener("load", () => {
    const body = document.body;
    
    /**
     * @type {NumberList}
     */
    let colour = get_random_array_element(colours)

    body.style.setProperty("--cccs-color-r", colour[0])
    body.style.setProperty("--cccs-color-g", colour[1])
    body.style.setProperty("--cccs-color-b", colour[2])
})

