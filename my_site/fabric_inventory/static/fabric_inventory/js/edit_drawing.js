stage.getContainer().style.border = '1px solid black';
// const gridLayer = new Konva.Layer();
// const contentLayer = new Konva.Layer();
// stage.add(gridLayer, contentLayer);
console.log('contentLayer', contentLayer);
let isSelectMode = false;
let gridSize = parseInt(document.getElementById('gridSize').value) || 50;

function drawGrid(gridSize) {
    gridLayer.destroyChildren();
    const width = stage.width();
    const height = stage.height();

    for (let i = 0; i < width; i += gridSize) {
        gridLayer.add(new Konva.Line({ points: [i, 0, i, height], stroke: '#ddd', strokeWidth: 1 }));
    }
    for (let j = 0; j < height; j += gridSize) {
        gridLayer.add(new Konva.Line({ points: [0, j, width, j], stroke: '#ddd', strokeWidth: 1 }));
    }
    gridLayer.draw();
}
// drawGrid(gridSize);

document.getElementById('gridSize').addEventListener('input', function() {
    gridSize = parseInt(this.value);
    drawGrid(gridSize);
});


let currentMode = 'select';
let selectedObjects = [];
const selectToolButton = document.getElementById('selectTool');
// const drawLineButton = document.getElementById('addLine');
const drawPol = document.getElementById('drawPolylineTool');
const addLineLabelButton  = document.getElementById('addLineLabel');
const saveDataButton = document.getElementById('saveData');
const calculateAreaButton = document.getElementById('calculateArea');

function setActiveButton(button) {
    [selectToolButton, drawPol, addLineLabelButton ].forEach(btn => btn.classList.remove('bg-secondary', 'text-white', 'active-button'));
    button.classList.add('bg-secondary', 'text-white', 'active-button');
}

addLineLabelButton .addEventListener('click', function() {
    currentMode = 'addLineLabel';
    isAddingLabels = !isAddingLabels;
    setActiveButton(this);
})

selectToolButton.addEventListener('click', function() {
    currentMode = 'select';
    setMode(currentMode)
    isSelectMode = true;
    setActiveButton(this);
});

// drawLineButton.addEventListener('click', function() {
//     currentMode = 'drawLine';
//     isSelectMode = false;
//     setActiveButton(this);
// });

drawPol.addEventListener('click', function() {
    currentMode = 'drawPolyLine';
    isSelectMode = false;
    setMode(currentMode);
    setActiveButton(this);
    // startDrawingPolyline();
});

// Функция привязки к сетке
function snapToGrid(value, gridSize) {
    return Math.round(value / gridSize) * gridSize;
}

let selectedLineGroup = null;
let selectedLabelGroup = null;
function addEditableLine(startX, startY, endX, endY) {
    

    const lineId = `line-${Date.now()}-${Math.random()}`;
    const lineGroup = new Konva.Group({ draggable: true, name: 'selectable', id: lineId });

    const line = new Konva.Line({
        points: [startX, startY, endX, endY],
        stroke: 'black',
        strokeWidth: 6,
        name: 'mainLine',
    });
    lineGroup.add(line);

    const boundingBox = new Konva.Line({
        points: [startX, startY, endX, endY],
        stroke: 'rgba(0, 0, 255, 0.5)',
        strokeWidth: 10,
        lineCap: 'round',
        lineJoin: 'round',
        visible: false,
        name: 'boundingBox',
    });
    lineGroup.add(boundingBox);
    boundingBox.moveToBottom();

    const startAnchor = new Konva.Circle({
        x: startX,
        y: startY,
        radius: 8,
        fill: 'red',
        draggable: true,
        visible: false,
        name: 'startAnchor',
    });

    const endAnchor = new Konva.Circle({
        x: endX,
        y: endY,
        radius: 8,
        fill: 'red',
        draggable: true,
        visible: false,
        name: 'endAnchor',
    });

    lineGroup.add(startAnchor);
    lineGroup.add(endAnchor);

    let label = null;

    contentLayer.add(lineGroup);
    contentLayer.draw();

    // Обновление линии и связанных объектов
    function updateLine() {
        const points = [startAnchor.x(), startAnchor.y(), endAnchor.x(), endAnchor.y()];
        line.points(points);
        boundingBox.points(points);

        if (label) {
            const midpointX = (points[0] + points[2]) / 2;
            const midpointY = (points[1] + points[3]) / 2;

            label.position({
                x: midpointX,
                y: midpointY,
            });
        }

        contentLayer.draw();
        console.log('updateLine', line.points());
    }

    function snapToGridPosition(pos) {
        return {
            x: snapToGrid(pos.x, gridSize),
            y: snapToGrid(pos.y, gridSize),
        };
    }

    line.on('mouseenter', () => {
        boundingBox.visible(true);
        contentLayer.draw();
    });

    line.on('mouseleave', () => {
        if (!startAnchor.visible()) {
            boundingBox.visible(false);
            contentLayer.draw();
        }
    });

    line.on('click', (e) => {
        e.cancelBubble = true;
        if (currentMode === 'addLineLabel') {
            addLabelToLine(line);
            return;
        } else if (currentMode === 'select') {
            console.log('selectedLineGroup', selectedLineGroup);
            if (selectedLineGroup) {
                const prevLine = selectedLineGroup.findOne('Line');
                const prevStartAnchor = selectedLineGroup.findOne('Circle');
                const prevEndAnchor = selectedLineGroup.findOne('Circle:last-child');

                // if (prevLine) prevLine.stroke('black');
                if (prevStartAnchor) prevStartAnchor.visible(false);
                if (prevEndAnchor) prevEndAnchor.visible(false);
            }
            selectedLineGroup = lineGroup;
            lineGroup.moveToTop();
            boundingBox.visible(true);
            startAnchor.visible(true);
            endAnchor.visible(true);
            contentLayer.draw();
            stage.setAttr('clickedOnLine', true);
        }
    });

    startAnchor.on('dragmove', function () {
        this.position(snapToGridPosition(this.position()));
        updateLine();
    });

    endAnchor.on('dragmove', function () {
        this.position(snapToGridPosition(this.position()));
        updateLine();
    });

    lineGroup.on('dragmove', function () {
        const snappedPos = snapToGridPosition(lineGroup.position());
        lineGroup.position(snappedPos);
        updateLine();
    });
}


function getLineCoordinates(line) {
    // Получаем массив точек линии
    const points = line.points(); // Массив: [x1, y1, x2, y2, ...]
    // Получаем смещение группы, если линия находится внутри группы
    const parent = line.getParent();
    const groupOffset = parent ? parent.getAbsolutePosition() : { x: 0, y: 0 };
    // Преобразуем координаты в абсолютные, учитывая смещение группы
    const absolutePoints = [];
    for (let i = 0; i < points.length; i += 2) {
        absolutePoints.push(points[i] + groupOffset.x);   // x-координата
        absolutePoints.push(points[i + 1] + groupOffset.y); // y-координата
    }
    return absolutePoints;
}

let isAddingLabels = false; 
// let lineLabelMap = new Map();

function addLabelToLine(line) {
    console.log('lineLabelMap', lineLabelMap);
    if (lineLabelMap.has(line.getParent().id())) {
        alert('У этой линии уже есть подпись.');
        return;
    }

    const labelId = `label-${Date.now()}-${Math.random()}`;
    const labelGroup = new Konva.Group({
        draggable: true,
        name: 'labelGroup',
        id: labelId,
    });
    const lineGroup = line.getParent();
    console.log('lineGroup', lineGroup);
    const linePoints = getLineCoordinates(line);
    console.log('linePoints', linePoints);
    const midpointX = (linePoints[0] + linePoints[2]) / 2;
    const midpointY = (linePoints[1] + linePoints[3]) / 2;

    // Текстовая подпись
    const label = new Konva.Text({
        text: 'Подпись',
        x: 0,
        y: 0,
        fontSize: 30,
        fontFamily: 'Times New Roman',
        fill: 'black',
        draggable: true,
        name: 'selectable',
    });

    // Обводка для подписи
    const labelBorder = new Konva.Rect({
        x: label.x(),
        y: label.y(),
        width: label.width(),
        height: label.height(),
        stroke: 'blue',
        strokeWidth: 1,
        visible: false,
    });

    label.on('click', () => {
        selectedLabelGroup = labelGroup;
        console.log('selectedLabelGroup', selectedLabelGroup);
        contentLayer.draw();
    });

    // Обновление размера обводки при изменении текста
    label.on('textChange', () => {
        labelBorder.width(label.width());
        labelBorder.height(label.height());
    });

    // Синхронизация позиции обводки с подписью
    label.on('dragmove', () => {
        labelBorder.position(label.position());
        contentLayer.batchDraw();
    });

    
    labelGroup.position({ x: midpointX, y: midpointY });
    // Обводка при наведении
    label.on('mouseenter', () => {
        labelBorder.visible(true);
        contentLayer.batchDraw();
    });

    label.on('mouseleave', () => {
        labelBorder.visible(false);
        contentLayer.batchDraw();
    });


    label.on('dblclick dbltap', () => {
        // Скрываем текст
        label.hide();
        contentLayer.draw();

        const textPosition = label.absolutePosition();
        const stageContainer = stage.container();
        const areaPosition = {
            x: stageContainer.offsetLeft + textPosition.x,
            y: stageContainer.offsetTop - 6 + textPosition.y,
        };

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);

        textarea.value = label.text();
        textarea.style.position = 'absolute';
        textarea.style.top = `${areaPosition.y}px`;
        textarea.style.left = `${areaPosition.x}px`;
        textarea.style.width = `${label.width() - label.padding() * 2 + 100}px`;
        textarea.style.height = `${label.height() - label.padding() * 2 + 10}px`;
        textarea.style.fontSize = `${label.fontSize()}px`;
        textarea.style.fontFamily = label.fontFamily();
        textarea.style.color = label.fill();
        textarea.style.border = 'none';
        textarea.style.background = 'none';
        textarea.style.outline = 'none';
        textarea.style.overflow = 'hidden';
        textarea.style.padding = '0px';
        textarea.style.margin = '0px';
        textarea.style.resize = 'none';
        textarea.style.zIndex = '1000';
        textarea.focus();
        textarea.select();

        let isTextareaRemoved = false;

        function removeTextarea() {
            if (isTextareaRemoved) return;
            isTextareaRemoved = true;
            document.body.removeChild(textarea);

            const newText = textarea.value.trim();
            if (newText === '') {
                // Если текст пустой, удаляем подпись и отвязываем её от линии
                labelGroup.destroy();
                lineLabelMap.delete(line.getParent().id());
                clearSelection();
            } else {
                // Если текст не пустой, сохраняем изменения
                label.text(newText);
                label.show();
            }
            contentLayer.draw();
        }

        textarea.addEventListener('blur', removeTextarea);

        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                removeTextarea();
            }
        });
    });

    // Добавление элементов в группу
    labelGroup.add(labelBorder);
    labelGroup.add(label);
    // Добавление на слой
    contentLayer.add(labelGroup);
    lineLabelMap.set(lineGroup.id(), labelGroup.id());
    contentLayer.draw();
}


// Обработчик клика по линии для добавления подписи
// stage.on('click', (e) => {
//     const clickedOutsideSelection = e.target === stage || e.target === contentLayer;
//     const clickedNode = e.target;
//     // console.log('clickedOutsideSelection', clickedOutsideSelection);
//     // console.log(stage.getAttr('clickedOnLine'));
//     // console.log('clickedNode', clickedNode);
//     if (clickedOutsideSelection) {
//         if (stage.getAttr('clickedOnLine') && selectedLineGroup) {
//             stage.setAttr('clickedOnLine', false);
//             selectedLineGroup.findOne('.boundingBox').visible(false);
//             selectedLineGroup.findOne('.startAnchor').visible(false);
//             selectedLineGroup.findOne('.endAnchor').visible(false);
//             selectedLineGroup = null;
//             contentLayer.draw();
//         }   
//         clearSelection();
//         return;
//     }
// });

// Переменные для рисования полилинии
let isDrawingPolyline = false;
let polylinePoints = [];
let startX, startY;

function startDrawingPolyline() {
    cancelPolylineDrawing();
    isDrawingPolyline = true;
    polylinePoints = [];

    polyline = new Konva.Line({ points: [], stroke: 'black', strokeWidth: 2, lineJoin: 'round', closed: false, draggable: false });
    contentLayer.add(polyline);
    contentLayer.draw();

    stage.on('mousedown', onPolylineMouseDown);
    stage.on('mousemove', onPolylineMouseMove);
    stage.on('dblclick', finishPolyline);
}

function onPolylineMouseDown(e) {
    if (!isDrawingPolyline) return;

    const pos = stage.getPointerPosition();
    const snappedX = snapToGrid(pos.x, gridSize);
    const snappedY = snapToGrid(pos.y, gridSize);
    if (polylinePoints.length === 0) {
        startX = snappedX;
        startY = snappedY;
    } else {
        const distance = Math.hypot(snappedX - startX, snappedY - startY);
        if (distance < gridSize) {
            finishPolyline();
            return;
        }
    }

    polylinePoints.push(snappedX, snappedY);
    polyline.points(polylinePoints);
    contentLayer.draw();
}

function onPolylineMouseMove(e) {
    if (!isDrawingPolyline || polylinePoints.length === 0) return;

    const pos = stage.getPointerPosition();
    const snappedX = snapToGrid(pos.x, gridSize);
    const snappedY = snapToGrid(pos.y, gridSize);

    const tempPoints = polylinePoints.slice().concat([snappedX, snappedY]);
    polyline.points(tempPoints);
    contentLayer.draw();
}

function cancelPolylineDrawing() {
    if (isDrawingPolyline) {
        isDrawingPolyline = false;

        // Удаляем временную полилинию, если она есть
        if (polyline) {
            polyline.destroy();
            contentLayer.draw();
        }

        // Отключаем события рисования
        stage.off('mousedown', onPolylineMouseDown);
        stage.off('mousemove', onPolylineMouseMove);
        stage.off('dblclick', finishPolyline);
    }
}

// Функция для проверки коллинеарности трех точек
function arePointsCollinear(p1, p2, p3) {
    return (p2.y - p1.y) * (p3.x - p2.x) === (p3.y - p2.y) * (p2.x - p1.x);
}

function arrayToDict(arr) {
    const points = [];
    for (let i = 0; i < arr.length - 1; i += 2) {
        points.push({ x: arr[i], y: arr[i + 1] });
    }
    return points;
}

function dictToArray(dict) {
    return dict.map(point => [point.x, point.y]).flat();
}

// Функция для упрощения полилинии: объединение коллинеарных точек
function simplifyPolyline(points_array) {
    let points = arrayToDict(points_array);
    if (points.length < 3) return dictToArray(points);  // Если меньше 3 точек, ничего не упрощаем

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

    return dictToArray(simplifiedPoints);
}

// Завершение рисования полилинии с учетом замыкания
function finishPolyline() {
    if (!isDrawingPolyline) return;

    
    polylinePoints = simplifyPolyline(polylinePoints);
    console.log('После упрощения', polylinePoints);
    polylinePoints = arrayToDict(polylinePoints);

    const pos = stage.getPointerPosition();
    const snappedX = snapToGrid(pos.x, gridSize);
    const snappedY = snapToGrid(pos.y, gridSize);

    // Проверяем, кликнули ли мы в начальную точку
    const distanceToStart = Math.hypot(snappedX - polylinePoints[0].x, snappedY - polylinePoints[0].y);
    const isClosingPolyline = distanceToStart < gridSize;
    console.log('Это начальная точка?', isClosingPolyline);

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
    polylinePoints = dictToArray(polylinePoints);
    // Завершаем рисование, отключаем обработчики событий
    isDrawingPolyline = false;
    stage.off('mousedown', onPolylineMouseDown);
    stage.off('mousemove', onPolylineMouseMove);
    stage.off('dblclick', finishPolyline);
    // Удаляем временную полилинию и добавляем сегменты как отдельные линии
    polyline.destroy();
    // Проверка: если `polylinePoints` содержит всего 2 точки, добавляем как одиночный отрезок
    if (!isClosingPolyline) { 
        for (let i = 0; i < polylinePoints.length-2; i += 2) {
            const [x1, y1, x2, y2] = [polylinePoints[i], polylinePoints[i + 1], polylinePoints[i + 2], polylinePoints[i + 3]];
            addEditableLine(x1, y1, x2, y2);
        }
        contentLayer.draw();
    } else {
        // Если точек больше, добавляем сегменты полилинии
        for (let i = 0; i < polylinePoints.length; i += 2) {
            const x1 = polylinePoints[i];
            const y1 = polylinePoints[i + 1];
            const x2 = polylinePoints[(i + 2) % polylinePoints.length]; // Используем модуль для замыкания
            const y2 = polylinePoints[(i + 3) % polylinePoints.length];
            addEditableLine(x1, y1, x2, y2);
        }
    }

    // Сбрасываем режим на выбор
    setMode('select');
    setActiveButton(selectToolButton);
}

// Создаем трансформер с настройками
const transformer = new Konva.Transformer({
    ignoreStroke: false,         // Игнорируем обводку
    rotateEnabled: false,       // Отключаем вращение
    enabledAnchors: [], // Ограничиваем якоря для линии
});

// Добавляем трансформер в слой
contentLayer.add(transformer);

// Функция для переключения режимов
function setMode(mode) {
    currentMode = mode;
    stage.container().style.cursor = mode === 'drawPolyLine' ? 'crosshair' : 'default';

    if (mode === 'select') {
        enableSelectionMode();
    } else {
        disableSelectionMode();
        // transformer.nodes([]);
    }
}

// Включение режима выделения
function enableSelectionMode() {
    stage.on('mousedown', startSelection);
    stage.on('mousemove', updateSelection);
    stage.on('mouseup', endSelection);
}

// Отключение режима выделения
function disableSelectionMode() {
    stage.off('mousedown', startSelection);
    stage.off('mousemove', updateSelection);
    stage.off('mouseup', endSelection);
}

// Функции для выбора и перемещения объектов
let selectionRect = new Konva.Rect({
    fill: 'rgba(0,0,255,0.1)',
    visible: false,
});
contentLayer.add(selectionRect);

let selectionStart = { x: 0, y: 0 };
// Флаг для хранения выбранных объектов
let selectedShapes = []; 

// Начало выделения
function startSelection(e) {
    if (currentMode !== 'select') return;

    const pos = stage.getPointerPosition();
    selectionStart.x = pos.x;
    selectionStart.y = pos.y;

    selectionRect.setAttrs({
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        visible: true,
    });
    contentLayer.draw();
}

// Обновление прямоугольника выделения
function updateSelection(e) {
    if (!selectionRect.visible()) return;

    const pos = stage.getPointerPosition();
    selectionRect.setAttrs({
        x: Math.min(selectionStart.x, pos.x),
        y: Math.min(selectionStart.y, pos.y),
        width: Math.abs(pos.x - selectionStart.x),
        height: Math.abs(pos.y - selectionStart.y),
    });
    contentLayer.batchDraw();
}

// // Завершение выделения и выбор объектов внутри рамки
function endSelection() {
    if (!selectionRect.visible()) return;

    setTimeout(() => {
        selectionRect.visible(false);
        contentLayer.batchDraw();
    });

    const box = selectionRect.getClientRect();
    const shapes = contentLayer.find('.selectable');
    selectedShapes = shapes.filter(shape => Konva.Util.haveIntersection(box, shape.getClientRect()));

    selectShapes(selectedShapes); // Применяем трансформер к выбранным объектам
}

// Обновление массива выбранных объектов с использованием Transformer
function updateSelectedObjects() {
    selectedShapes = transformer.nodes(); // Присваиваем выделенные объекты в массив
    transformer.nodes(selectedShapes); // Передаём выделенные объекты Transformer
    contentLayer.draw();
}

// Функция для удаления выделенных элементов
function deleteSelectedElements() {
    // Удаляем каждый выделенный элемент и его рамку
    selectedShapes.forEach(shape => {
        if (shape.selectionBox) {
            shape.selectionBox.destroy(); // Удаляем рамку выделения
            shape.selectionBox = null; // Убираем ссылку на рамку
        }
        shape.destroy(); // Удаляем сам объект из слоя
    });

    selectedShapes = []; // Очищаем массив выделенных элементов
    transformer.nodes([]); // Очищаем трансформер
    contentLayer.draw(); // Обновляем слой для отражения изменений
}

// Обработчик события нажатия клавиши Delete
window.addEventListener('keydown', (e) => {
    if (e.key === 'Delete') {
        console.log('SEL LINE', selectedLineGroup);
        console.log('Sel Group', selectedLabelGroup);
        if (currentMode === 'select') {
            if (selectedLabelGroup) {
                // Находим ID линии, связанной с выбранной подписью
                const lineIdForLabel = Array.from(lineLabelMap.entries()).find(
                    ([lineId, labelId]) => labelId === selectedLabelGroup.id()
                )?.[0];

                if (!lineIdForLabel) {
                    console.log('Не удалось найти линию для подписи');
                    return;
                }

                // Удаляем связь из lineLabelMap
                lineLabelMap.delete(lineIdForLabel);

                // Удаляем выбранную подпись
                selectedLabelGroup.destroy();
                clearSelection();
                contentLayer.draw();
            } else if (selectedLineGroup) {
                // Находим ID подписи, связанной с выбранной линией
                const labelIdForLine = lineLabelMap.get(selectedLineGroup.id());
                console.log('Label ID FOR LINE', labelIdForLine);

                if (labelIdForLine) {
                    // Удаляем подпись
                    const labelGroupForLine = contentLayer.findOne(`#${labelIdForLine}`);
                    labelGroupForLine.destroy();
                    console.log('Удалил подпись.')
                }

                // Удаляем линию и связь из lineLabelMap
                lineLabelMap.delete(selectedLineGroup.id());
                selectedLineGroup.destroy();
                selectedLineGroup = null;

                clearSelection();
                contentLayer.draw();
            } else {
                deleteSelectedElements(); // Удаляем другие элементы
            }
        }
    } else if (e.key === 'Escape') {
        if (currentMode === 'addLineLabel' || currentMode === 'drawPolyLine') {
            cancelPolylineDrawing();
            currentMode = 'select';
            setMode(currentMode);
            setActiveButton(selectToolButton);
        }
    }
});


// Снятие выделения со всех объектов
function clearSelection() {
    selectedShapes.forEach(shape => {
        shape.draggable(false); // Отключаем перетаскивание
    });
    selectedShapes = []; // Очищаем массив выбранных объектов
    selectedLabelGroup = null;
    selectedLineGroup = null;
    transformer.nodes([]); // Очищаем трансформер
    contentLayer.draw();
}

// Обработчик для снятия выделения при клике за пределами объектов
stage.on('click', (e) => {
    const clickedOutsideSelection = e.target === stage || e.target === contentLayer;
    const clickedNode = e.target;
    console.log('clickedOutsideSelection', clickedOutsideSelection);
    console.log('clickedNode', clickedNode);
    console.log('selectedLineGroup',stage.getAttr('clickedOnLine'), selectedLineGroup);
    if (clickedOutsideSelection) {
        if (stage.getAttr('clickedOnLine') && selectedLineGroup) {
            stage.setAttr('clickedOnLine', false);
            selectedLineGroup.findOne('.boundingBox').visible(false);
            selectedLineGroup.findOne('.startAnchor').visible(false);
            selectedLineGroup.findOne('.endAnchor').visible(false);
            selectedLineGroup = null;
            contentLayer.draw();
        }   
        clearSelection();
        return;
    }
});

// Функция для выделения группы объектов
function selectShapes(shapes) {
    clearSelection(); // Очищаем предыдущее выделение

    selectedShapes = shapes; // Сохраняем выбранные объекты

    shapes.forEach(shape => shape.draggable(true)); // Включаем перетаскивание
    transformer.nodes(shapes); // Устанавливаем трансформер для выделенных объектов
    contentLayer.draw();
}

// Обработчик для перетаскивания группы
contentLayer.on('dragmove', function () {
    if (selectedShapes.length > 1) {
        const { x, y } = selectedShapes[0].position();

        // Перемещаем все выделенные объекты вместе
        selectedShapes.forEach((shape, index) => {
            if (index > 0) {
                const dx = shape.x() - selectedShapes[0].x();
                const dy = shape.y() - selectedShapes[0].y();
                shape.position({ x: x + dx, y: y + dy });
            }
        });
        contentLayer.batchDraw();
    }
});

function orderVertices(linesWithLabels) {
    const vertices = [];
    const visited = new Set();

    let currentPoint = linesWithLabels[0].point1; // Начинаем с первой точки
    while (vertices.length < linesWithLabels.length) {
        vertices.push(currentPoint);
        visited.add(JSON.stringify(currentPoint));

        // Ищем следующую линию, которая начинается в currentPoint
        const nextLine = linesWithLabels.find(line => 
            !visited.has(JSON.stringify(line.point2)) && 
            (line.point1.x === currentPoint.x && line.point1.y === currentPoint.y)
        );

        if (!nextLine) break; // Если следующая линия не найдена, фигура разорвана
        currentPoint = nextLine.point2;
    }

    return vertices;
}

function sortLines(lines) {
    const sortedLines = [];
    const remainingLines = [...lines];

    // Начнем с любой линии
    sortedLines.push(remainingLines.pop());

    while (remainingLines.length > 0) {
        const lastLine = sortedLines[sortedLines.length - 1];
        const lastPoint = lastLine.point2;

        // Найти линию, которая начинается или заканчивается в точке lastPoint
        const nextIndex = remainingLines.findIndex(line =>
            (line.point1.x === lastPoint.x && line.point1.y === lastPoint.y) ||
            (line.point2.x === lastPoint.x && line.point2.y === lastPoint.y)
        );

        if (nextIndex === -1) {
            throw new Error("Не удалось соединить все линии. Проверьте данные.");
        }

        const nextLine = remainingLines.splice(nextIndex, 1)[0];

        // Убедимся, что направление совпадает (соединяем точки)
        if (nextLine.point1.x === lastPoint.x && nextLine.point1.y === lastPoint.y) {
            sortedLines.push(nextLine);
        } else {
            // Меняем точки местами для корректного направления
            sortedLines.push({
                ...nextLine,
                point1: nextLine.point2,
                point2: nextLine.point1,
            });
        }
    }

    return sortedLines;
}

function normalizeLines(lines) {
    return lines.map(line => {
        const { point1, point2 } = line;
        if (point1.x > point2.x || (point1.x === point2.x && point1.y > point2.y)) {
            
            return { ...line, point1: point2, point2: point1 };
        }
        return line;
    });
}

function getLinesWithLabels() {
    let linesWithLabels = [];
    console.log(lineLabelMap);
    let lineIndex = 0;
    // Перебираем все группы линий
    contentLayer.find('Group').forEach(group => {
        lineIndex++;
        const line = group.findOne('.mainLine'); // Находим линию в группе
        const lineId = group.id(); // ID текущей группы линии

        // Ищем подпись в lineLabelMap
        const labelId = lineLabelMap.get(lineId); // Получаем ID связанной подписи
        const labelGroup = labelId ? contentLayer.findOne(`#${labelId}`) : null; // Находим группу подписи по ID

        if (line && labelGroup) {
            const points = line.points(); // Координаты линии
            const labelText = labelGroup.findOne('Text'); // Находим текст подписи внутри группы
            linesWithLabels.push({
                // index: group.getAttr('index') || 0, // Индекс группы
                point1: { x: points[0], y: points[1] }, // Начальная точка
                point2: { x: points[2], y: points[3] }, // Конечная точка
                label_obj: parseFloat(labelText.text()), // Объект текста подписи
            });
        }
    });
    console.log('LINE Index', linesWithLabels);
    
    // Сортируем массив по индексу линий
    linesWithLabels = normalizeLines(linesWithLabels);
    linesWithLabels = reorderLinesAndAddLengths(linesWithLabels);
    console.log('LINE Index', linesWithLabels);
    return linesWithLabels;
}

function calculateAreaFromScene() {
    const linesWithLabels = getLinesWithLabels();
    const sortedLines = sortLines(linesWithLabels);
    console.log('sortedLines', sortedLines);

    if (linesWithLabels.length > 0) {
        // Извлекаем реальные длины сторон из подписей
        // const realSideLengths = linesWithLabels.map(line => parseFloat(line.label_obj.text()));
        const realSideLengths = linesWithLabels.map(line => line.label_obj);
        // const vertices = orderVertices(linesWithLabels);
        vertices = linesWithLabels.map(line => line.point1);
        console.log('vertices', vertices);
        console.log('realSideLengths', realSideLengths);
        // Извлекаем начальные точки линий (вершины)
        

        // Вычисляем площадь
        const area = calculatePolygonAreaWithRealDimensions(vertices, realSideLengths).toFixed(2);
        inputArea.value = area;
        console.log(area);
        current_area = area;
        console.log('Площадь фигуры:', area);
        return area;
    }

    console.log('Фигура не замкнута или не содержит линий с подписями.');
    return 0;
}

function reorderLinesAndAddLengths(lines) {
    // Шаг 1: Собрать уникальные точки
    const pointsSet = new Set();
    lines.forEach(line => {
        pointsSet.add(`${line.point1.x},${line.point1.y}`);
        pointsSet.add(`${line.point2.x},${line.point2.y}`);
    });

    // Преобразовать в массив объектов точек
    const points = Array.from(pointsSet).map(str => {
        const [x, y] = str.split(',').map(Number);
        return { x, y };
    });

    // Шаг 2: Вычислить центр фигуры
    const center = points.reduce(
        (acc, point) => ({
            x: acc.x + point.x / points.length,
            y: acc.y + point.y / points.length
        }),
        { x: 0, y: 0 }
    );

    // Функция для вычисления угла точки относительно центра
    const getAngle = (point) => Math.atan2(point.y - center.y, point.x - center.x);

    // Шаг 3: Упорядочить точки в линиях
    points.sort((a, b) => {
        const angleA = getAngle(a);
        const angleB = getAngle(b);
        return angleA - angleB;
    });

    // Шаг 4: Создать новый массив линий в упорядоченном порядке
    const reorderedLines = [];
    for (let i = 0; i < points.length; i++) {
        const point1 = points[i];
        const point2 = points[(i + 1) % points.length]; // Следующая точка, замыкаем на первую
        const originalLine = lines.find(line =>
            (line.point1.x === point1.x && line.point1.y === point1.y && line.point2.x === point2.x && line.point2.y === point2.y) ||
            (line.point2.x === point1.x && line.point2.y === point1.y && line.point1.x === point2.x && line.point1.y === point2.y)
        );

        reorderedLines.push({
            point1,
            point2,
            label_obj: originalLine?.label_obj || 0 // Если линия найдена, берём длину, иначе 0
        });
    }
    return reorderedLines;
}

// Переработанная функция вычисления площади
function calculatePolygonAreaWithRealDimensions(vertices, realSideLengths) {
    let pixelSideLengths = [];
    let realVertices = [];

    // Рассчитать длины сторон в пикселях
    for (let i = 0; i < vertices.length; i++) {
        const current = vertices[i];
        const next = vertices[(i + 1) % vertices.length]; // Замыкание на первый элемент
        const pixelLength = Math.sqrt(Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2));
        pixelSideLengths.push(pixelLength);
    }

    // Рассчитать реальные координаты вершин
    realVertices.push({ x: 0, y: 0 }); // Начальная вершина
    for (let i = 1; i < vertices.length; i++) {
        const pixelLength = pixelSideLengths[i - 1];
        const realLength = realSideLengths[i - 1];
        const scaleFactor = realLength / pixelLength;

        const previousRealVertex = realVertices[i - 1];
        const currentVertex = vertices[i];
        const previousVertex = vertices[i - 1];

        const dx = currentVertex.x - previousVertex.x;
        const dy = currentVertex.y - previousVertex.y;

        // Масштабируем координаты
        const realX = previousRealVertex.x + dx * scaleFactor;
        const realY = previousRealVertex.y + dy * scaleFactor;

        realVertices.push({ x: realX, y: realY });
    }

    // Рассчитать площадь по формуле Гаусса
    let area = 0;
    for (let i = 0; i < realVertices.length; i++) {
        const current = realVertices[i];
        const next = realVertices[(i + 1) % realVertices.length]; // Замыкание
        area += current.x * next.y - next.x * current.y;
    }

    return Math.abs(area / 2);
}


// const confirmActionButton = document.getElementById('confirmAction');
// const confirmationModal = new bootstrap.Modal(document.getElementById('confirmModal'));
// const warningModal = new bootstrap.Modal(document.getElementById('warningModal'));
// // Если пользователь подтверждает действие, выполняем отправку данных
// confirmActionButton.addEventListener('click', function() {
//     confirmationModal.hide(); // Закрываем модальное окно
//     sendCroppedImageToServer(); // Ваша функция отправки данных
// });


// Обработчик кнопки сохранения данных
// document.getElementById('saveData').addEventListener('click', function() {
//     confirmationModal.show();
// });
// drawPol.addEventListener('click', () => setMode('drawPolyline'));
// Привязываем запуск рисования полилинии к кнопке
drawPol.addEventListener('click', startDrawingPolyline);
// Привязка функции добавления линии к кнопке
// drawPol.addEventListener('click', addEditablePolyline);
// selectToolButton.addEventListener('click', () => setMode('select'));
// saveDataButton.addEventListener('click', saveScene);
setMode(currentMode);
setActiveButton(selectToolButton);
calculateAreaButton.addEventListener('click', calculateAreaFromScene);


function restoreEditableLine(lineGroup) {
    const line = lineGroup.findOne('.mainLine');
    const startAnchor = lineGroup.findOne('.startAnchor');
    const endAnchor = lineGroup.findOne('.endAnchor');
    const boundingBox = lineGroup.findOne('.boundingBox');

    let labelGroup = lineLabelMap.get(lineGroup.id());

    if (!line || !startAnchor || !endAnchor || !boundingBox) {
        console.log('Невозможно восстановить линию.');
        return;
    }
    function snapToGridPosition(pos) {
        return {
            x: snapToGrid(pos.x, gridSize),
            y: snapToGrid(pos.y, gridSize),
        };
    }
    function updateLine() {
        const points = [startAnchor.x(), startAnchor.y(), endAnchor.x(), endAnchor.y()];
        line.points(points);
        boundingBox.points(points);

        // if (labelGroup) {
        //     const midpointX = (points[0] + points[2]) / 2;
        //     const midpointY = (points[1] + points[3]) / 2;

        //     labelGroup.position({
        //         x: midpointX,
        //         y: midpointY,
        //     });
        // }

        contentLayer.draw();
    }

    line.on('mouseenter', () => {
        boundingBox.visible(true);
        contentLayer.draw();
    });

    line.on('mouseleave', () => {
        if (!startAnchor.visible()) {
            boundingBox.visible(false);
            contentLayer.draw();
        }
    });

    line.on('click', (e) => {
        e.cancelBubble = true;
        if (currentMode === 'addLineLabel') {
            addLabelToLine(line);
            return;
        } else if (currentMode === 'select') {
            
            // if (stage.getAttr('clickedOnLine')) {
            //     return;
            // }
            // if (selectedLineGroup) {
            // if (stage.getAttr('clickedOnLine')) {
            //     console.log('LineGroup', lineGroup);
            //     const prevLine = lineGroup.findOne('Line');
            //     const prevStartAnchor = lineGroup.findOne('.startAnchor');
            //     const prevEndAnchor = lineGroup.findOne('.endAnchor');

            //     // if (prevLine) prevLine.stroke('black');
            //     if (prevStartAnchor) prevStartAnchor.visible(false);
            //     if (prevEndAnchor) prevEndAnchor.visible(false);
            //     contentLayer.draw();
            //     return;
            // }

            selectedLineGroup = lineGroup;
            lineGroup.moveToTop();
            boundingBox.visible(true);
            startAnchor.visible(true);
            endAnchor.visible(true);
            contentLayer.draw();
            stage.setAttr('clickedOnLine', true);
        }
    });

    startAnchor.on('dragmove', function () {
        this.position(snapToGridPosition(this.position()));
        updateLine();
    });

    endAnchor.on('dragmove', function () {
        this.position(snapToGridPosition(this.position()));
        updateLine();
    });

    lineGroup.on('dragmove', function () {
        const snappedPos = snapToGridPosition(lineGroup.position());
        lineGroup.position(snappedPos);
        updateLine();
    });

    stage.on('click', (e) => {
        if (e.target !== line && e.target !== startAnchor && e.target !== endAnchor) {
            boundingBox.visible(false);
            startAnchor.visible(false);
            endAnchor.visible(false);
            // console.log('selectedLineGroup', selectedLineGroup);
            selectedLineGroup = null;
            contentLayer.draw();
        }
    });
}

function restoreLabel(lineGroup) {
    const labelIdForLine = lineLabelMap.get(lineGroup.id());
    labelGroup = contentLayer.findOne(`#${labelIdForLine}`);
    console.log('LABEL', labelGroup);
    if (!labelGroup) {
        console.log('Невозможно восстановить подпись.');
        return;
    }

    const label = labelGroup.findOne('Text');
    const labelBorder = labelGroup.findOne('Rect');

    label.on('click', () => {
        selectedLabelGroup = label.getParent();
        console.log('LABEL GROUP', selectedLabelGroup);
        contentLayer.draw();
    });

    label.on('textChange', () => {
        labelBorder.width(label.width());
        labelBorder.height(label.height());
    });

    label.on('dragmove', () => {
        labelBorder.position(label.position());
        contentLayer.batchDraw();
    });

    label.on('mouseenter', () => {
        labelBorder.visible(true);
        contentLayer.batchDraw();
    });

    label.on('mouseleave', () => {
        labelBorder.visible(false);
        contentLayer.batchDraw();
    });

    label.on('dblclick dbltap', () => {
        label.hide();
        contentLayer.draw();

        const textPosition = label.absolutePosition();
        const stageContainer = stage.container();
        const areaPosition = {
            x: stageContainer.offsetLeft + textPosition.x,
            y: stageContainer.offsetTop - 6 + textPosition.y,
        };

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);

        textarea.value = label.text();
        textarea.style.position = 'absolute';
        textarea.style.top = `${areaPosition.y}px`;
        textarea.style.left = `${areaPosition.x}px`;
        textarea.style.width = `${label.width() - label.padding() * 2 + 100}px`;
        textarea.style.height = `${label.height() - label.padding() * 2 + 10}px`;
        textarea.style.fontSize = `${label.fontSize()}px`;
        textarea.style.fontFamily = label.fontFamily();
        textarea.style.color = label.fill();
        textarea.style.border = 'none';
        textarea.style.background = 'none';
        textarea.style.outline = 'none';
        textarea.style.overflow = 'hidden';
        textarea.style.padding = '0px';
        textarea.style.margin = '0px';
        textarea.style.resize = 'none';
        textarea.style.zIndex = '1000';
        textarea.focus();
        textarea.select();

        let isTextareaRemoved = false;

        function removeTextarea() {
            if (isTextareaRemoved) return;
            isTextareaRemoved = true;
            document.body.removeChild(textarea);

            const newText = textarea.value.trim();
            if (newText === '') {
                labelGroup.destroy();
                lineLabelMap.delete(group);
            } else {
                label.text(newText);
                label.show();
            }
            contentLayer.draw();
        }

        textarea.addEventListener('blur', removeTextarea);

        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                removeTextarea();
            }
        });
    });
}

contentLayer.find('Group').forEach((group) => {
    restoreEditableLine(group);
    restoreLabel(group);
});


