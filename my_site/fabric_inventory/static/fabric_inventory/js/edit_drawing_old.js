function transformPolygonToLine() {
    let pol = canvas.getObjects('Polygon')[0];
    console.log('pol', pol);
    if (!pol) {
        return;
    }
    const points = pol.points;
    for (let i = 0; i < points.length; i++) {
        // Вычисляем начальную и конечную точки для каждой линии
        const start = points[i];
        const end = points[(i + 1) % points.length]; // Замкнуть полигон, соединив последнюю точку с первой
      
        // Создаем объект fabric.Line
        const line = new fabric.Line([start.x, start.y, end.x, end.y], {
          stroke: 'black',   
          strokeWidth: 2,    
          selectable: true,  
          lockRotation: true,
          lockScalingY: true,
        });
        console.log('line', line.controls);
        canvas.add(line); // Добавляем линию на канвас
    }
    canvas.remove(pol);
    // Обновляем канвас, чтобы отобразить изменения
    canvas.renderAll();
}


console.log('Canvas', canvas);
canvas.getObjects('Polygon').forEach(function(obj) {
    console.log(obj);
    obj.set({
        fill: 'rgba(0,0,255,0.1)',
        stroke: 'blue',
        strokeWidth: 2,
        selectable: true,
        evented: false,
        absolutePositioned: true,
        objectCaching: false,
        hasControls: false,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true,
        hasBorders: false
    });
});
// Сделать сетку невыбираемой и невзаимодействующей
let group = canvas.getObjects("Group")[0];
group.selectable = false;
group.evented = false;

canvas.remove(...canvas.getObjects("textbox"));
canvas.renderAll();

// Настройка сетки
let grid = document.getElementById('gridSize').value;
function drawGrid() {
    canvas.remove(...canvas.getObjects("group"))
    let lines = [];
    // Рисуем новые линии сетки
    for (let i = 0; i <= (canvas.width / grid); i++) {
    const vertical = new fabric.Line([ i * grid, 0, i * grid, canvas.height], {
        stroke: '#c9c9c9',
        selectable: false,
        evented: false
    });
    lines.push(vertical);
    }
    for (let i = 0; i <= (canvas.height / grid); i++) {
    const horizontal = new fabric.Line([ 0, i * grid, canvas.width, i * grid], {
        stroke: '#c9c9c9',
        selectable: false,
        evented: false
    });
    lines.push(horizontal);
    }
    const groupLines = new fabric.Group(lines, {
        selectable: false,
        evented: false,
    })
    
    canvas.add(groupLines);
    canvas.renderAll();
    canvas.toDataURL({
        format: 'png',
        multiplier: 1,
        quality: 1,
        left: 0,
        top: 0,
        width: canvas.width,
        height: canvas.height,
        callback: function (dataUrl) {
          fabric.Image.fromURL(dataUrl, (img) => {
            img.selectable = false;
            img.evented = false;
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
              originX: 'left',
              originY: 'top',
            });
            canvas.remove(groupLines); // Удаляем группу сетки, чтобы оставить только фоновое изображение
          });
        },
      });
}

// drawGrid();

// Обработчик изменения размера сетки
document.getElementById('gridSize').addEventListener('input', function() {
    grid = parseInt(this.value);
    console.log('Размер сетки изменен', grid);
    // document.getElementById('gridSizeLabel').innerText = grid + ' px';
    drawGrid();
});

transformPolygonToLine();

// Установка режима инструмента
let currentMode = 'select'; // 'select', 'drawLine', 'drawPolyline', 'addLabel'

const selectToolButton = document.getElementById('selectTool');
const drawPolylineToolButton = document.getElementById('drawPolylineTool');
const addLineLabelButton = document.getElementById('addLineLabel');
const drawLine = document.getElementById('addLine');


addLineLabelButton.addEventListener('click', function() {
    currentMode = 'addLineLabel';
    canvas.isDrawingMode = false;
    canvas.selection = false;
    setActiveButton(this);
    console.log("Переключился на режим " + currentMode);
})


selectToolButton.addEventListener('click', function() {
    currentMode = 'select';
    canvas.isDrawingMode = false;
    canvas.selection = true;
    setActiveButton(this);
});

drawLine.addEventListener('click', function() {
    currentMode = 'drawLine';
    canvas.isDrawingMode = true;
    canvas.selection = false;
    setActiveButton(this);
    console.log("Переключился на режим " + currentMode);
});

drawPolylineToolButton.addEventListener('click', function() {
    currentMode = 'drawPolyline';
    canvas.isDrawingMode = true;
    canvas.selection = false;
    setActiveButton(this);
});


// Функция для установки активной кнопки
function setActiveButton(button) {
    [selectToolButton, drawPolylineToolButton, addLineLabelButton, drawLine].forEach(btn => {
    btn.classList.remove('bg-secondary', 'text-white', 'active-button');
    });
    button.classList.add('bg-secondary', 'text-white', 'active-button');
}

// Устанавливаем режим выделения по умолчанию
setActiveButton(selectToolButton);

// Функция для проверки коллинеарности трех точек
function arePointsCollinear(p1, p2, p3) {
    return (p2.y - p1.y) * (p3.x - p2.x) === (p3.y - p2.y) * (p2.x - p1.x);
}

// Функция для упрощения полилинии: объединение коллинеарных точек
function simplifyPolyline(points) {
    if (points.length < 3) return points;  // Если меньше 3 точек, ничего не упрощаем
    
    let simplifiedPoints = [points[0]];  // Начинаем с первой точки

    for (let i = 1; i < points.length - 1; i++) {
        let p1 = simplifiedPoints[simplifiedPoints.length - 1];  // Последняя добавленная точка
        let p2 = points[i];  // Текущая точка
        let p3 = points[i + 1];  // Следующая точка

        // Если три точки не коллинеарны, добавляем точку
        if (!arePointsCollinear(p1, p2, p3)) {
            simplifiedPoints.push(p2);  // Добавляем точку, если она не на одной линии
        }
    }

    // Добавляем последнюю точку, если она не замкнута, либо после проверки замыкания
    simplifiedPoints.push(points[points.length - 1]);

    // Проверяем коллинеарность последней, предпоследней и первой точек
    if (simplifiedPoints.length > 2) {
        let lastPoint = simplifiedPoints[simplifiedPoints.length - 1]; // Последняя точка
        let penultimatePoint = simplifiedPoints[simplifiedPoints.length - 2]; // Предпоследняя точка
        let firstPoint = simplifiedPoints[0]; // Первая точка

        // Если первая, предпоследняя и последняя точки коллинеарны, удаляем последнюю точку
        if (arePointsCollinear(firstPoint, penultimatePoint, lastPoint)) {
            simplifiedPoints.pop();  // Удаляем последнюю точку
        }
    }

    return simplifiedPoints;
}

//Массив с данными точек для последнего нарисованного полигона
let lastPolylinePoints = [];

// Инструменты для рисования
let isDrawing = false;
let line;
let startX, startY;
let isClosed = false;

let polylinePoints = [];
let polyline;
// let linesWithLabels = [];
let linesWithLabels = canvas.lines_with_labels;
console.log('linesWithLabels', linesWithLabels);
linesWithLabels.forEach(line => {
    // console.log('line', line);
    let label = line.label_obj;
    console.log('label_line', label);
    fabric.Textbox.fromObject(label)
        .then(text => {
            console.log('text', text);
            canvas.add(text);
            canvas.requestRenderAll();
        })
        .catch(error => {
            console.error('Error creating textbox:', error);
    });
})

canvas.on('text:changed', function(event) {
    const textbox = event.target;
    console.log("Выбрана подпись:", textbox.getRelativeXY());
    let line = findPolygonAtClick(textbox.getRelativeXY()).line;
    console.log("Выбрана подпись:", line);
    findNeededTextbox(line, textbox);
    console.log("Массив линий", linesWithLabels);
});


function findNeededTextbox(line, sel_textbox) {
    let select_idx = line.index_line;
    linesWithLabels.forEach(text_box => {
        if (text_box.index === select_idx) {
            text_box.label_obj = sel_textbox.toObject();
        }
    });
}

// let startX, startY;
let previewLine = null; // Предварительная линия

canvas.on('mouse:down', function(o){
    const pointer = canvas.getPointer(o.e);
    const x = Math.round(pointer.x / grid) * grid;
    const y = Math.round(pointer.y / grid) * grid;
    console.log('currentMode', currentMode);
    if (currentMode === 'addLineLabel') {
        console.log('Label Mode:', currentMode);
        // Поиск полигона при клике рядом с его линией
        let result = findPolygonAtClick(pointer);
        if (result) {
            let line = result.line;

            if (linesWithLabels.some(l => l.index === line.index_line)) {
                console.log("На эту линию уже добавлена подпись.");
                return; // Выход из функции, если подпись уже существует
            }

            // Вычисляем середину выбранной линии
            let midX = (line.point1.x + line.point2.x) / 2;
            let midY = (line.point1.y + line.point2.y) / 2;

            // Вычисляем длину линии
            let length = Math.sqrt(Math.pow((line.point2.x - line.point1.x), 2) + Math.pow((line.point2.y - line.point1.y), 2));

            // Добавляем текст (подпись) на середину выбранной линии
            let label = new fabric.Textbox("Размер", {
                left: midX,
                top: midY,
                fontSize: 30,
                fill: 'blue',
                originX: 'center',
                originY: 'center',
                editable: true
            });

            canvas.add(label);
            canvas.setActiveObject(label);
            label.enterEditing();
            label.selectAll();
            canvas.renderAll();
            // Сохраняем данные о линии и подписи в массив
            linesWithLabels.push({
                index: line.index_line, 
                point1: { x: line.point1.x, y: line.point1.y }, // координаты начала линии
                point2: { x: line.point2.x, y: line.point2.y }, // координаты конца линии
                label_obj: label
            });
        }
        console.log('linesWithLabels', linesWithLabels);
        return;
    };

    if (currentMode === 'drawPolyline') {
        if (!isDrawing) {
            isDrawing = true;
            polylinePoints = [{ x: x, y: y }];
            polyline = new fabric.Polyline(polylinePoints, {
            stroke: 'black',
            strokeWidth: 2,
            fill: 'transparent',
            selectable: false,
            evented: false,
            absolutePositioned: true,
            objectCaching: false
            });
            canvas.add(polyline);
        } else {
            // Проверяем, если пользователь кликнул в начальную точку, завершаем рисование
            const firstPoint = polylinePoints[0];
            if (x === firstPoint.x && y === firstPoint.y && polylinePoints.length > 2) {
                polylinePoints.push({ x: firstPoint.x, y: firstPoint.y });
                finishDrawingPolyline();
            } else {
                polylinePoints = simplifyPolyline(polylinePoints);
                polylinePoints.push({ x: x, y: y });
                polyline.set({ points: polylinePoints });
                polyline.setCoords();
                canvas.renderAll();
            }
        }
    }

    if (currentMode === 'drawLine') {
        console.log('IndrawLine', currentMode);
        if (!isDrawing) {
            isDrawing = true;
            const pointer = canvas.getPointer(o.e);
            const x = snapToGrid(pointer.x);
            const y = snapToGrid(pointer.y);
            if (!startX && !startY) {
                // Начало новой линии
                startX = x;
                startY = y;
    
                previewLine = new fabric.Line([startX, startY, startX, startY], {
                    stroke: 'black',
                    strokeWidth: 2,
                    selectable: false,
                    evented: false,
                });
                canvas.add(previewLine);
            }
            else{
                const line = new fabric.Line([snapToGrid(startX), snapToGrid(startY), snapToGrid(x), snapToGrid(y)], {
                    stroke: 'black',
                    strokeWidth: 2,
                    //selectable: !isDrawingMode, // Линии можно выделять только в режиме выделения
                    hasBorders: false,
                    hasControls: true,
                    lockScalingY: true,
                    lockScalingX: false,
                });
                canvas.add(line);
                startX = startY = null; // Сбрасываем начальные координаты
                canvas.remove(previewLine);
                previewLine = null;
                canvas.renderAll();
            }
        }
    }
});

canvas.on('mouse:move', function(o){
    if (!isDrawing) return;
    const pointer = canvas.getPointer(o.e);
    let x = Math.round(pointer.x / grid) * grid;
    let y = Math.round(pointer.y / grid) * grid;

    if (currentMode === 'drawPolyline') {
        const tempPoints = polylinePoints.concat([{ x: x, y: y }]);
        polyline.set({ points: tempPoints });
        polyline.setCoords();
        canvas.renderAll();
    }
    else if (currentMode === 'drawLine') {
        const pointer = canvas.getPointer(o.e);
        const x = snapToGrid(pointer.x);
        const y = snapToGrid(pointer.y);

        // Обновляем координаты предварительной линии
        previewLine.set({ x2: x, y2: y });
        canvas.renderAll();
    }
});



// Добавление возможности завершить рисование при нажатии Esc или двойном клике
document.addEventListener('keydown', function(e) {
    console.log('Клавиши', currentMode);
    if (e.key === 'Escape') {
        if (currentMode === 'drawPolyline' && isDrawing) {
            finishDrawingPolyline();
        }
        // Переходим в режим выделения
        currentMode = 'select';
        setActiveButton(selectToolButton);
        canvas.selection = true;
        } else if (currentMode === 'drawPolyline' && isDrawing && e.key === 'Enter') {
        finishDrawingPolyline();
    }
});

canvas.on('mouse:dblclick', function(o) {
    console.log('Двойной клик', currentMode);
    if (currentMode === 'drawPolyline' && isDrawing) {
        finishDrawingPolyline();
    }
});


let distanceThreshold = 20;

// Функция для нахождения ближайшего полигона и его стороны
function findPolygonAtClick(pointer) {
    let objects = canvas.getObjects();
    let selectedPolygon = null;
    let closestLine = null;
    let minDistance = Infinity;

    // Перебираем все объекты на холсте
    for (let i = 0; i < objects.length; i++) {
        if (objects[i] instanceof fabric.Polygon) {
            let polygon = objects[i];
            let points = polygon.points;

            // Перебираем все стороны полигона
            for (let j = 0; j < points.length; j++) {
                let point1 = points[j];
                let point2 = points[(j + 1) % points.length];

                // Вычисляем расстояние от точки клика до текущей линии полигона
                let distance = distanceToLine(pointer, point1, point2);

                // Если расстояние меньше текущего минимального и порогового значения
                if (distance < minDistance && distance <= distanceThreshold) {
                    minDistance = distance;
                    closestLine = {index_line: j, point1: point1, point2: point2, labelAdded: false};
                    selectedPolygon = polygon;
                    break;
                }
            }
        }
    }

    if (selectedPolygon) {
    // Возвращаем выбранный полигон и его ближайшую линию
    return {
        polygon: selectedPolygon,
        line: closestLine
    };
    }
    return null;
}

// Функция для вычисления расстояния от точки до линии
function distanceToLine(point, lineStart, lineEnd) {
    let A = point.x - lineStart.x;
    let B = point.y - lineStart.y;
    let C = lineEnd.x - lineStart.x;
    let D = lineEnd.y - lineStart.y;

    let dot = A * C + B * D;
    let len_sq = C * C + D * D;
    let param = (len_sq !== 0) ? (dot / len_sq) : -1;

    let xx, yy;

    if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
    }
    else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
    }
    else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
    }

    let dx = point.x - xx;
    let dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}


function finishDrawingPolyline() {
    // Завершаем рисование полилинии
    isDrawing = false;
    polylinePoints = simplifyPolyline(polylinePoints);
    // Проверяем, замкнута ли полилиния
    const firstPoint = polylinePoints[0];
    // Проверка на коллинеарность последней точки, первой точки и второй точки
    if (polylinePoints.length > 2) {
        const secondPoint = polylinePoints[1];
        const secondToLastPoint = polylinePoints[polylinePoints.length - 1];

        // Если последняя точка, первая точка и вторая точка коллинеарны, удаляем последнюю
        if (arePointsCollinear(secondToLastPoint, firstPoint, secondPoint)) {
            polylinePoints.shift(); // Удаляем замыкающую точку, если она излишняя
        }
    }

    // Преобразуем полилинию в многоугольник
    lastPolylinePoints = polylinePoints;
    const polygon = new fabric.Polygon(polylinePoints, {
        fill: 'rgba(0,0,255,0.1)',
        stroke: 'blue',
        strokeWidth: 2,
        selectable: true,
        evented: false,
        absolutePositioned: true,
        objectCaching: false,
        hasControls: false,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true,
        hasBorders: false
    });
    canvas.remove(polyline);
    canvas.add(polygon);

    // Переходим в режим выделения
    currentMode = 'select';
    setActiveButton(selectToolButton);
    canvas.selection = true;
    canvas.isDrawingMode = false;

    // Выделяем новый многоугольник
    canvas.setActiveObject(polygon);

    // Автоматически рассчитываем площадь
    current_area = calculateArea();

    polyline = null;
    polylinePoints = [];
    canvas.renderAll();
}

// Привязка перемещения объектов к сетке
canvas.on('object:moving', function(options) {
    const obj = options.target;
    if (obj.type === 'textbox') {
        return;
    };

    obj.set({
        left: Math.round(obj.left / grid) * grid,
        top: Math.round(obj.top / grid) * grid
    });
    if (obj.type === 'line') {
        // Вычисляем центр линии
        const centerX = (obj.x1 + obj.x2) / 2;
        const centerY = (obj.y1 + obj.y2) / 2;

        // Вычисляем ближайшие координаты сетки для центра
        const snappedCenterX = snapToGrid(centerX);
        const snappedCenterY = snapToGrid(centerY);

        // Вычисляем смещение
        const deltaX = snappedCenterX - centerX;
        const deltaY = snappedCenterY - centerY;

        // Применяем смещение к каждой точке линии
        obj.set({
            x1: obj.x1 + deltaX,
            y1: obj.y1 + deltaY,
            x2: obj.x2 + deltaX,
            y2: obj.y2 + deltaY
        });
    } else if (obj.type === 'polyline' || obj.type === 'polygon') {
    // Привязка вершин многоугольника к сетке
    const points = obj.get('points');
    points.forEach(function(p) {
        p.x = Math.round(p.x / grid) * grid;
        p.y = Math.round(p.y / grid) * grid;
    });
    obj.set({ points: points });
    }
});

// Функция для вычисления ближайшей точки сетки
function snapToGrid(value) {
    return Math.round(value / gridSize) * gridSize;
}

// Функция привязки концов линии к сетке при перемещении
function snapLineToGrid(line) {
    const deltaX = line.left - (line._origLeft || 0);
    const deltaY = line.top - (line._origTop || 0);

    line.set({
        x1: line.x1 + deltaX,
        y1: line.y1 + deltaY,
        x2: line.x2 + deltaX,
        y2: line.y2 + deltaY,
        left: 0,
        top: 0
    });

    // Привязка концов линии к сетке
    line.set({
        x1: Math.round(line.x1 / grid) * grid,
        y1: Math.round(line.y1 / grid) * grid,
        x2: Math.round(line.x2 / grid) * grid,
        y2: Math.round(line.y2 / grid) * grid
    });

    line.setCoords();
}

// Отключение возможности вращения объектов (запасной вариант, если появятся контроллы)
canvas.on('object:rotating', function(e) {
    e.target.angle = 0;
});

// Отключение масштабирования объектов
canvas.on('object:scaling', function(e) {
    e.target.scaleX = 1;
    e.target.scaleY = 1;
});

// Удаление объекта при нажатии Delete или Backspace
document.addEventListener('keydown', function(e) {
    if (e.key === 'Delete') {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
        activeObjects.forEach(function(obj) {
        console.log('Удаляем:', obj.type);
        if (obj.type === 'polyline' || obj.type === 'polygon' || obj.type === 'line'
            || obj.type === 'textbox') {
            canvas.remove(obj);
        }
        });
        canvas.discardActiveObject();
        canvas.renderAll();
        polyline = null;
        polylinePoints = [];
        linesWithLabels = [];
    }
    };
    if (e.key === 'Enter') {
        const active_object = canvas.getActiveObject();
        console.log('Активный объект:', active_object.type);
        if (active_object.type === 'textbox') {
            active_object.enterEditing();
        };
        canvas.discardActiveObject();
        canvas.renderAll();
    }
});
let customCanvas = canvas.toObject();
customCanvas.lines_with_labels = linesWithLabels;
// Функция расчета площади фигуры
function calculateArea() {
    if (linesWithLabels){
        linesWithLabels.sort((a, b) => a.index - b.index);
        let realSideLengths = linesWithLabels.map(line => parseFloat(line.label_obj.text));
        let vertices = linesWithLabels.map(line => line.point1);
        console.log(realSideLengths);
        console.log(vertices);
        let area = calculatePolygonAreaWithRealDimensions(vertices, realSideLengths).toFixed(2);
        inputArea.value = area;
        console.log(area);
        current_area = area;
        customCanvas = canvas.toObject();
        customCanvas.lines_with_labels = linesWithLabels;
        console.log('linesWithLabels', linesWithLabels);
        console.log('linesWithLabels_custom', customCanvas);
        return area;
    }
    return 0;
}
function calculatePolygonAreaWithRealDimensions(vertices, realSideLengths) {
    let pixelSideLengths = [];
    let realVertices = [];
    
    // Шаг 1: Рассчитать длины сторон в пикселях
    for (let i = 0; i < vertices.length; i++) {
        let current = vertices[i];
        let next = vertices[(i + 1) % vertices.length];
        let pixelLength = Math.sqrt(Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2));
        pixelSideLengths.push(pixelLength);
    }

    // Шаг 2: Рассчитать реальные координаты вершин
    realVertices.push({ x: 0, y: 0 }); // Первая вершина остается на месте
    for (let i = 1; i < vertices.length; i++) {
        let pixelLength = pixelSideLengths[i - 1];
        let realLength = realSideLengths[i - 1];
        let scaleFactor = realLength / pixelLength;
        
        let previousRealVertex = realVertices[i - 1];
        let currentVertex = vertices[i];
        let previousVertex = vertices[i - 1];

        let dx = currentVertex.x - previousVertex.x;
        let dy = currentVertex.y - previousVertex.y;

        // Применяем масштабный коэффициент для перехода к реальным координатам
        let realX = previousRealVertex.x + dx * scaleFactor;
        let realY = previousRealVertex.y + dy * scaleFactor;

        realVertices.push({ x: realX, y: realY });
    }

    // Шаг 3: Рассчитать площадь по реальным координатам
    let area = 0;
    for (let i = 0; i < realVertices.length; i++) {
        let current = realVertices[i];
        let next = realVertices[(i + 1) % realVertices.length];
        area += current.x * next.y - next.x * current.y;
    }
    return Math.abs(area / 2);
}


// Обработчик кнопки расчета площади
document.getElementById('calculateArea').addEventListener('click', calculateArea);

// document.getElementById('saveData').addEventListener('click', function() {
    
// });