// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
// https://stackoverflow.com/questions/59438413/how-do-i-remove-the-old-svg-elements-and-then-replace-it-with-a-new-one





let rc
let svg

let cells = []
let pixs = []

let DEBUG = false

class Pix {
  constructor(x, y, b) {
    this.x = x
    this.y = y
    this.locked = false

  }
}

class Cell {
  constructor(x, y, w, h) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
  }
}



obj = {
  holesProbability : 0.2,
  autoHoles : false,
  autoSeed: true,
  seed: 9999,
  nrows: 4,
  ncols: 3,
  gutterSize: 5,
  margins: 5,
  resolutionX: 1000,
  resolutionY: 800,
  generate: generate,
  save: function () { saveSvg(svg, "strip_" + obj.seed + "_" + new Date + ".svg") },
}

var GUI = lil.GUI;
const gui = new GUI();
gui.add(obj, 'autoSeed');
gui.add(obj, 'seed');
gui.add(obj, 'resolutionX');
gui.add(obj, 'resolutionY');
gui.add(obj, 'ncols');
gui.add(obj, 'nrows');
gui.add(obj, 'gutterSize');
gui.add(obj, 'autoHoles');
gui.add(obj, 'holesProbability', 0, 1, 0.05);
//gui.add(obj, 'margins', 0, 50, 1);
gui.add(obj, 'generate');
gui.add(obj, 'save');

var rand = mulberry32(obj.seed)
generate()

function generate() {

  temp = document.getElementById("container");
  if (temp) {
    temp.remove();
  }

  svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("id", "container");
  svg.innerHTML = "";
  document.body.appendChild(svg);
  svg.setAttribute("class", "jscreated");
  svg.style.width = obj.resolutionX
  svg.style.height = obj.resolutionY
  svg.style.position = 'fixed'
  svg.style.left = '50%'
  svg.style.top = '50%'
  svg.style.transform = 'translate(-50%, -50%)'

  if (DEBUG) console.log(svg)

  rc = rough.svg(svg);

  if (obj.autoSeed) {
    gui.controllers[1].setValue(parseInt(Math.random() * 9999))
    //console.log(obj.autoSeed)
  }
  rand = mulberry32(obj.seed)
  
  //for (var i = 0; i < 15; i++) console.log(i,rand());

  if (DEBUG) console.log(seed)


  nrows = obj.nrows
  ncols = obj.ncols
  gutterSize = obj.gutterSize
  margins = obj.margins

  cells = []
  pixs = []



  pageW = obj.resolutionX - margins
  pageH = obj.resolutionY - margins

  cellW = (pageW - gutterSize * (ncols + 1)) / ncols
  cellH = (pageH - gutterSize * (nrows + 1)) / nrows

  // intialize each pixel in our grid
  for (let i = 0; i < ncols * nrows; i++) {
    let x = i % ncols
    let y = parseInt(i / ncols)
    pixs.push(new Pix(x, y, false))
  }


  // for each pixel we will try to create cells
  for (let i = 0; i < ncols * nrows; i++) {
    if (DEBUG) console.log("case : " + i)

    if (pixs[i].locked == false) {
      let x = i % ncols
      let y = parseInt(i / ncols)
      let w = parseInt(rand() * (ncols - (x + 1)) + 1)
      let h = parseInt(rand() * (nrows - (y + 1)) + 1)
      if (DEBUG) console.log("suggested : ", x, y, w, h)
      // check that the pix on the left and down are not locked if w and h are > 1
      let xspace = w
      let yspace = h
      for (let a = i + w; a >= i; a--) {
        if (a < pixs.length) {
          if (DEBUG) console.log("a : ", a, pixs[a].locked, xspace)
          if (pixs[a].locked == true) {
            xspace = (xspace - (a + 1) < 1 ? 1 : xspace - (a + 1))
          }
        }
        for (let b = a + h * ncols; b >= a; b -= ncols) {
          if (b < pixs.length) {
            if (DEBUG) console.log("b : ", b, pixs[b].locked, yspace)
            if (pixs[b].locked == true) {
              yspace = (yspace - parseInt(b / ncols) < 1 ? 1 : yspace - (parseInt(b / ncols)))
            }
          }
        }
      }
      w = xspace
      h = yspace
      if (DEBUG) console.log("updated : ", x, y, w, h)

      // locking pixels composing the final cell
      for (let a = 0; a < w; a++) {
        for (let b = 0; b < h; b++) {
          let index = i + a + b * ncols
          pixs[index].locked = true
          if (DEBUG) console.log("index locked ", a, b, index)
        }
      }
      if (DEBUG) console.log(pixs)
      cells.push(new Cell(x, y, w, h))
    }
  }
  if (DEBUG) console.log(pixs)
  if (DEBUG) console.log(cells)


  render()
}

window.addEventListener("keypress", (evt) => {
  if (evt.key === 's') saveSvg(svg, "strip " + new Date + ".svg")
});




// https://stackoverflow.com/a/46403589
function saveSvg(svgEl, name) {
  svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  var svgData = svgEl.outerHTML;
  var preface = '<?xml version="1.0" standalone="no"?>\r\n';
  var svgBlob = new Blob([preface, svgData], {
    type: "image/svg+xml;charset=utf-8"
  });
  var svgUrl = URL.createObjectURL(svgBlob);
  var downloadLink = document.createElement("a");
  downloadLink.href = svgUrl;
  downloadLink.download = name;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}



function render() {
  let px = -1
  let py = -1
  for (let i = 0; i < cells.length; i++) {

    let x = (cells[i].x * cellW + cells[i].x * gutterSize)
    let y = (cells[i].y * cellH + cells[i].y * gutterSize)
    let w = (cellW * cells[i].w + gutterSize * (cells[i].w - 1))
    let h = (cellH * cells[i].h + gutterSize * (cells[i].h - 1))



    if(obj.autoHoles){
      if (rand()>obj.holesProbability){
        let node = rc.rectangle(x, y, w, h, {
          roughness: 0,
          fill: 'rgba(0,0,0,0)',
          disableMultiStroke: true,
          disableMultiStrokeFill: true,
          stroke: 'black'
    
        }); // x, y, width, height
        svg.appendChild(node)

      }
    }
    else{
      let node = rc.rectangle(x, y, w, h, {
        roughness: 0,
        fill: 'rgba(0,0,0,0)',
        disableMultiStroke: true,
        disableMultiStrokeFill: true,
        stroke: 'black'
  
      }); // x, y, width, height
      svg.appendChild(node)

    }
    
  }
  //pop()
}



function mulberry32(a) {
  return function () {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}
