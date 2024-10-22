const inputArea = document.getElementById('inputArea');
let current_area = 0;

window.onload = function() {
    document.getElementById('inputArea').value = '';  // Очищаем поле при загрузке
  };
// Инициализация Canvas
const canvas = new fabric.Canvas('canvas', {
    selection: true,
    backgroundColor: '#fff'
});

// Отключаем вращение и масштабирование для всех объектов по умолчанию
canvas.on('object:added', function(e) {
    const obj = e.target;
    obj.set({
    hasControls: false,
    lockRotation: true,
    lockScalingX: true,
    lockScalingY: true,
    hasBorders: false
    });
});

// Настройка сетки
let grid = document.getElementById('gridSize').value;

// Функция для рисования сетки
function drawGrid() {
    // Удаляем существующие линии сетки
    canvas.getObjects('gridLine').forEach(function(line) {
    canvas.remove(line);
    });

    // Рисуем новые линии сетки
    for (let i = 0; i <= (canvas.width / grid); i++) {
    const vertical = new fabric.Line([ i * grid, 0, i * grid, canvas.height], {
        stroke: '#c9c9c9',
        selectable: false,
        evented: false,
        type: 'gridLine'
    });
    canvas.add(vertical);
    }

    for (let i = 0; i <= (canvas.height / grid); i++) {
    const horizontal = new fabric.Line([ 0, i * grid, canvas.width, i * grid], {
        stroke: '#c9c9c9',
        selectable: false,
        evented: false,
        type: 'gridLine'
    });
    canvas.add(horizontal);
    }

    // Отправляем сетку на задний план
    canvas.sendToBack(...canvas.getObjects('gridLine'));
}

// Начальное рисование сетки
drawGrid();

// Обработчик изменения размера сетки
document.getElementById('gridSize').addEventListener('input', function() {
    grid = parseInt(this.value);
    // document.getElementById('gridSizeLabel').innerText = grid + ' px';
    drawGrid();
});

// Установка режима инструмента
let currentMode = 'select'; // 'select', 'drawLine', 'drawPolyline', 'addLabel'

const selectToolButton = document.getElementById('selectTool');
const drawPolylineToolButton = document.getElementById('drawPolylineTool');
const addLineLabelButton = document.getElementById('addLineLabel');


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


drawPolylineToolButton.addEventListener('click', function() {
    currentMode = 'drawPolyline';
    canvas.isDrawingMode = false;
    canvas.selection = false;
    setActiveButton(this);
});


// Функция для установки активной кнопки
function setActiveButton(button) {
    [selectToolButton, drawPolylineToolButton, addLineLabelButton].forEach(btn => {
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
let linesWithLabels = [];


canvas.on('mouse:down', function(o){
    const pointer = canvas.getPointer(o.e);
    const x = Math.round(pointer.x / grid) * grid;
    const y = Math.round(pointer.y / grid) * grid;
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


function findObjectByName(name) {
    return canvas.getObjects().filter(function(obj) {
    return obj.name === name;
    })[0];  // Возвращаем первый объект с заданным именем
}

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
    snapLineToGrid(obj);
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
// Формула для вычисления площади многоугольника
function computePolygonArea(vertices) {
    let total = 0;
    for (let i = 0, l = vertices.length; i < l; i++) {
    const addX = vertices[i].x;
    const addY = vertices[(i + 1) % l].y;
    const subX = vertices[(i + 1) % l].x;
    const subY = vertices[i].y;

    total += (addX * addY);
    total -= (subX * subY);
    }
    return Math.abs(total / 2) / (grid * grid); // Приводим к реальным единицам (например, кв.м)
}

// Обработчик кнопки расчета площади
document.getElementById('calculateArea').addEventListener('click', calculateArea);


function saveCroppedImage() {
    const allObjects = canvas.getObjects();
    let padding = 50;
    // Находим объект Polygon и все Textbox
    const polygon = allObjects.find(obj => obj.type === 'polygon');
    const textboxes = allObjects.filter(obj => obj.type === 'textbox');

    // Если Polygon не найден, выходим из функции
    if (!polygon) {
        console.warn('Polygon object not found on the canvas.');
        return;
    }

    // Функция для нахождения экстремальных координат (границ) объектов
    function findBoundingBox(objects) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        objects.forEach(obj => {
            const bounds = obj.getBoundingRect();  // Получаем границы объекта
            minX = Math.min(minX, bounds.left);
            minY = Math.min(minY, bounds.top);
            maxX = Math.max(maxX, bounds.left + bounds.width);
            maxY = Math.max(maxY, bounds.top + bounds.height);
        });

        return { minX, minY, maxX, maxY };
    }

    // Определяем границы объекта Polygon и подписей
    const boundingBox = findBoundingBox([polygon, ...textboxes]);

    // Добавляем отступы
    const croppedWidth = Math.max(boundingBox.maxX - boundingBox.minX + padding * 2, 0);
    const croppedHeight = Math.max(boundingBox.maxY - boundingBox.minY + padding * 2, 0);

    // Изменяем размер холста
    canvas.setDimensions({
        width: croppedWidth,
        height: croppedHeight
    });

    // Получаем все объекты с холста
    const kek = canvas.getObjects();

    // Фильтруем только объекты типа Polygon и Textbox
    const polygonsAndTextboxes = kek.filter(obj =>
        obj.type === 'polygon' || obj.type === 'textbox'
    );

    // Сдвигаем все объекты так, чтобы они находились на новом холсте с отступами
//    canvas.forEachObject(obj => {
    polygonsAndTextboxes.forEach(obj => {
        let uu = polygonsAndTextboxes.filter(ii =>
            ii.type === 'textbox'
        );

        const bounds = obj.getBoundingRect(); // Получаем границы объекта для правильного смещения

        // Перемещаем объект с учетом его текущих координат и границ
        const newLeft = obj.left - boundingBox.minX + padding;
        const newTop = obj.top - boundingBox.minY + padding;

        // Обновляем координаты объекта
        obj.set({
            left: newLeft,
            top: newTop
        });

        // Проверяем, если объект за пределами новой области
        if (newLeft < -padding || newTop < -padding || newLeft + bounds.width > croppedWidth || newTop + bounds.height > croppedHeight) {
            console.warn(`Textbox out of bounds: left=${newLeft}, top=${newTop}, width=${bounds.width}, height=${bounds.height}`);
        }

        // Для отладки: визуализируем границы
        const debugRect = new fabric.Rect({
            left: newLeft,
            top: newTop,
            width: bounds.width,
            height: bounds.height,
            fill: 'rgba(255, 0, 0, 0.2)',
            stroke: 'red',
            strokeWidth: 1,
            selectable: false,
            evented: false,
            visible: true
        });
        canvas.add(debugRect);
        console.log("объект", obj);
    });
    textboxes.forEach((textbox) => {
        console.log(`Textbox visibility: ${textbox.visible}, left: ${textbox.left}, top: ${textbox.top}, text: ${textbox.text}`);
    });

    // Перерисовываем холст
    canvas.renderAll();

    // Экспортируем изображение как DataURL
    const croppedImageURL = canvas.toDataURL({
        format: 'png',
        multiplier: 1,
    });

    // Отправка изображения на сервер
    sendCroppedImageToServer(croppedImageURL);
}

// Получение CSRF-токена из cookie
function getCSRFToken() {
    let cookieValue = null;
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        // Проверяем наличие "csrftoken" в cookie
        if (cookie.substring(0, 10) === 'csrftoken=') {
        cookieValue = decodeURIComponent(cookie.substring(10));
        break;
        }
    }
    return cookieValue;
}


const confirmActionButton = document.getElementById('confirmAction');
const confirmationModal = new bootstrap.Modal(document.getElementById('confirmModal'));
const warningModal = new bootstrap.Modal(document.getElementById('warningModal'));
// Если пользователь подтверждает действие, выполняем отправку данных
confirmActionButton.addEventListener('click', function() {
    confirmationModal.hide(); // Закрываем модальное окно
    sendCroppedImageToServer(); // Ваша функция отправки данных
});

function sendCroppedImageToServer() {
    // current_area = calculateArea();
    current_area = inputArea.value;
    if (!current_area){
        warningModal.show();
        return;
    }
    let imageDataURL = canvas.toDataURL({
        format: 'png',
        multiplier: 1 // Множитель для увеличения разрешения
    });
    // let canvasData = canvas.toJSON();
    // console.log(canvasData);
    const selectElement = document.getElementById('categorySelect');
    // Получаем CSRF-токен
    const csrftoken = getCSRFToken();
    // Пример отправки изображения на сервер
    imageDataURL = imageDataURL.replace(/^data:image\/(png|jpeg);base64,/, "");
    fetch('/upload-image', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
    },
    body: JSON.stringify({ image: imageDataURL,
                            area: parseFloat(inputArea.value),
                            status: 'available',
                            fabrictype_id: parseInt(selectElement.value),
                            // canvas_data: canvasData,
                            })
    })
    .then(response => response.json())
    .then(data => {
        if (data.redirect_url) {
            // Если сервер вернул URL для редиректа, выполняем переход
            window.location.href = data.redirect_url;
        } else if (data.error) {
            // Обработка ошибок, если есть
            console.error(data.error);
        }
        console.log('Success:', data)})
    .catch(error => console.error('Error:', error));
}

// Обработчик кнопки сохранения данных
document.getElementById('saveData').addEventListener('click', function() {
    confirmationModal.show();
});