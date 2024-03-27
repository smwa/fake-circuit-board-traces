const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let canvasSizeX = 12000;
let canvasSizeY = 6000;
let scalar = 1.6;
let numberOfLines = 10000;
let gridX = 60;
let gridY = 30;

let blockedOffX = 22; // Can be undefined
let blockedOffY = 10;

const generate = () => {

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
    ctx.fillStyle = '#FFFFFF';
    ctx.fill()
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

  ctx.clearRect(0, 0, canvasSizeX, canvasSizeY);

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


};







generate();

document.getElementById('download').onclick = () => { downloadCanvasAsImage(canvas) };
document.getElementById('generate').onclick = generate;
