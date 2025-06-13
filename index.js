let ctx = null;

const generate = () => {
  const CANVAS_SIZE = 800;

  const input_ratio = parseFloat(document.getElementById('input-ratio').value);
  const input_line = parseFloat(document.getElementById('input-line').value);
  const input_num_lines = parseFloat(document.getElementById('input-num-lines').value);
  const input_grid_x = parseFloat(document.getElementById('input-grid-x').value);
  const input_grid_y = parseFloat(document.getElementById('input-grid-y').value);
  const input_blocked_x = parseFloat(document.getElementById('input-blocked-x').value);
  const input_blocked_y = parseFloat(document.getElementById('input-blocked-y').value);

  let canvasSizeX = CANVAS_SIZE;
  let canvasSizeY = canvasSizeX * input_ratio;
  let scalar = input_line;
  let numberOfLines = input_num_lines;
  let gridX = input_grid_x;
  let gridY = input_grid_y;
  let blockedOffX = input_blocked_x; // Can be undefined
  let blockedOffY = input_blocked_y;

  if (
    isNaN(blockedOffX)
    || isNaN(blockedOffY)
  ) {
    blockedOffX = undefined;
    blockedOffY = undefined;
  }


  ctx = new C2S(canvasSizeX, canvasSizeY)


  const blockOffGrid = (grid) => {
    // This function doesn't have to do anything. Good for blocking off a text area

    if (typeof(blockedOffX) === "undefined" || typeof(blockedOffY) === "undefined") {
      console.log("returning")
      return;
    };

    for (let i = blockedOffX; i <= gridX - blockedOffX; i++) {
      for (let j = blockedOffY; j <= gridY - blockedOffY; j++) {
        grid[i][j] = 0;
      }
    }

    for (let j = blockedOffY + 1; j <= gridY - blockedOffY - 1; j++) {
      grid[blockedOffX - 1][j] = 0;
      grid[gridX - blockedOffX + 1][j] = 0;
    }

  };

  const canvasSizeAverage = (canvasSizeX + canvasSizeY) / 2.0;
  const gridPointSizeX = canvasSizeX / gridX;
  const gridPointSizeY = canvasSizeY / gridY;
  const lineWidth = scalar * canvasSizeAverage / 400;
  const dotLineWidth = scalar * lineWidth * 1.8;
  const dotSize = scalar * lineWidth * 0.5;

  const drawLine = (points) => {
    const _points = points.map(gridPointToCanvasPoint);

    ctx.strokeStyle = "#000000";
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    const firstPoint = _points.shift();
    ctx.moveTo(firstPoint.x, firstPoint.y);

    _points.forEach(point => {
      ctx.lineTo(point.x, point.y);
    });

    ctx.stroke();

    drawConnection(firstPoint);
    drawConnection(_points[_points.length - 1]);
  };

  const drawConnection = (point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, dotSize, 0, 2 * Math.PI, false);
    ctx.lineWidth = dotLineWidth;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
  };

  const gridPointToCanvasPoint = (point) => {
    return {
      x: ((point.x * gridPointSizeX) + dotSize * 4) * (1 - ((dotSize * 6) / canvasSizeX)),
      y: ((point.y * gridPointSizeY) + dotSize * 4) * (1 - ((dotSize * 6) / canvasSizeY)),
    };
  };

  const randomPoint = () => {
    return {
      x: Math.floor(Math.random() * gridX),
      y: Math.floor(Math.random() * gridY),
    };
  };

  const grid = [];
  for (let i = 0; i < gridX; i++) {
    const n = [];
    for (let j = 0; j < gridY; j++) {
      n.push(1);
    }
    grid.push(n);
  }

  blockOffGrid(grid);

  const linesToDraw = [];

  for (let i = 0; i < numberOfLines; i++) {
    linesToDraw.push([
      randomPoint(),
      randomPoint(),
    ])
  }

  counter = 0;

  linesToDraw.map((line) => {

    if (grid[line[0].x][line[0].y] < 1) {
      // console.error("Starting point unavailable");
      return null;
    }

    const graph = new Graph(grid, { diagonal: true });
    const start = graph.grid[line[0].x][line[0].y];
    const end = graph.grid[line[1].x][line[1].y];
    const result = astar.search(graph, start, end);
    if (result.length < 1) {
      // console.error("No path found");
      return null;
    }
    result.unshift(start);
    let prev = start;

    // clear gap around start and ends:
    [start, end].forEach((p) => {
      for (let i = p.x - 1; i <= p.x + 1; i++) {
        for (let j = p.y - 1; j <= p.y + 1; j++) {
          if (grid[i] && grid[i][j]) {
            grid[i][j] = 0;
          }
        }
      }
    });

    result.forEach((node) => {
      grid[node.x][node.y] = 0;

      if (node.x != prev.x && node.y != prev.y) { // Diagonal
        // Removes hitches, which were fun
        grid[prev.x][node.y] = 0;
      }

      prev = node;
    });
    return result.map((node) => ({
      x: node.x,
      y: node.y,
    }));
  })
  .filter((x) => x)
  .map(drawLine);

  document.getElementById("svg-container").innerHTML = ctx.getSerializedSvg();

};







generate();

document.getElementById('download').onclick = () => {
  var source = ctx.getSerializedSvg();

  //add name spaces.
  if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  //add xml declaration
  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

  //convert svg source to URI data scheme.
  var url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);

  let xhr = new XMLHttpRequest();
  xhr.responseType = 'blob';
  xhr.onload = function () {
    let a = document.createElement('a');
    a.href = window.URL.createObjectURL(xhr.response);
    a.download = 'circuits.svg';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  xhr.open('GET', url); // This is to download the canvas Image
  xhr.send();
};

document.getElementById('generate').onclick = generate;
