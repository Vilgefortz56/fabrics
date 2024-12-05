const stage = new Konva.Stage({
    container: 'canvasContainer',
    width: 1300,
    height: 750,
});
let isFirstLoad = true;

let currentArea = document.getElementById('area-data').textContent;
document.getElementById('inputArea').value = parseFloat(currentArea.replace(',', '.'));
console.log(currentArea);
console.log(document.getElementById('inputArea').value);
const currentViewId = document.getElementById('viewid-data').textContent;
const currentStatusId = document.getElementById('status-data').textContent;
console.log(currentStatusId);

let gridLayer = null;
let contentLayer = null;
let lineLabelMap = null;

// function loadScene() {
//     const sceneJSON = document.getElementById('canvas-data').textContent;
//     console.log('Row data', sceneJSON);
//     // Парсим JSON
//     const savedScene = JSON.parse(JSON.parse(sceneJSON));
//     console.log(savedScene);
//     // console.log(JSON.parse(savedScene));
//     // Восстанавливаем слои
//     gridLayer = Konva.Node.create(savedScene.gridLayer);
//     contentLayer = Konva.Node.create(savedScene.contentLayer);

//     // Очищаем существующие слои
//     stage.findOne('#gridLayer')?.destroy();
//     stage.findOne('#contentLayer')?.destroy();

//     // Добавляем восстановленные слои на сцену
//     stage.add(gridLayer);
//     stage.add(contentLayer);

//     // Восстанавливаем карту (Map)
//     lineLabelMap = new Map();
//     savedScene.lineLabelMap.forEach(({ lineId, labelId }) => {
//         lineLabelMap.set(lineId, labelId);
//     });
//     console.log(lineLabelMap);
//     // return lineLabelMap;
// }

function loadScene() {
    const sceneJSON = document.getElementById('canvas-data').textContent;
    console.log('Raw data', sceneJSON);

    // Парсим JSON
    const savedScene = JSON.parse(JSON.parse(sceneJSON));
    console.log('DATA', savedScene);
    // Восстанавливаем слои
    gridLayer = Konva.Node.create(savedScene.gridLayer);
    contentLayer = Konva.Node.create(savedScene.contentLayer);

    // Очищаем существующие слои
    stage.findOne('#gridLayer')?.destroy();
    stage.findOne('#contentLayer')?.destroy();

    // Добавляем восстановленные слои на сцену
    stage.add(gridLayer);
    stage.add(contentLayer);

    // Восстанавливаем карту lineLabelMap
    lineLabelMap = new Map();

    savedScene.lineLabelMap.forEach(({ lineId, labelId }) => {
        const lineNode = contentLayer.findOne(`#${lineId.id}`);
        const labelNode = contentLayer.findOne(`#${labelId.id}`);

        if (lineNode && labelNode) {
            lineLabelMap.set(lineNode, labelNode);
        } else {
            console.warn('Не удалось найти объекты для восстановления связи:', lineId, labelId);
        }
    });

    console.log('Восстановленный lineLabelMap:', lineLabelMap);

    contentLayer.draw();
}


document.addEventListener("DOMContentLoaded",  loadScene);
// document.addEventListener("DOMContentLoaded", renderCanvas);
document.addEventListener('DOMContentLoaded', function () {
    const fabricTypeSelect = document.querySelector('[name="fabric_type"]');
    const fabricViewSelect = document.querySelector('[name="fabric_view"]');
    const statusSelect = document.querySelector('[name="status"]');
    const form = document.getElementById('fabricEditForm');
    const hiddenCanvasDataInput = document.getElementById('canvasData');

    // Проверка на существование формы и скрытого поля
    if (!form) {
        console.error("Form with id 'fabricEditForm' not found.");
        return;
    }
    if (!hiddenCanvasDataInput) {
        console.error("Hidden input with id 'canvasData' not found.");
        return;
    }

    form.addEventListener('submit', function(event) {
        customCanvas = canvas.toObject();
        customCanvas.lines_with_labels = linesWithLabels;
        // Преобразуем данные canvas в JSON и записываем в скрытое поле
        const serializedCanvasData = JSON.stringify(customCanvas);
        console.log(customCanvas);
        console.log(serializedCanvasData);
        hiddenCanvasDataInput.value = serializedCanvasData;
        let imageDataURL = canvas.toDataURL({
            format: 'png',
            multiplier: 1 // Множитель для увеличения разрешения
        });
        document.getElementById('editImage').value = imageDataURL;
    });
    fabricTypeSelect.addEventListener('change', function () {
        const fabricTypeId = this.value;
        if (fabricTypeId) {
            // Отправляем AJAX запрос для получения соответствующих видов ткани
            fetch(`/get_fabric_views/${fabricTypeId}/?current_view_id=${currentViewId}&current_status_id=${currentStatusId}`)
            .then(response => response.json())
            .then(data => {
                // Обновляем "Вид материала"
                fabricViewSelect.innerHTML = ''; // Очистить существующие опции
                data.views.forEach(function (fabricView) {
                    const option = document.createElement('option');
                    option.value = fabricView.id;
                    option.textContent = fabricView.name;
                    fabricViewSelect.appendChild(option);
                    
                    // Устанавливаем текущий вид, если он совпадает с переданным
                    if (isFirstLoad && fabricView.id == data.current_view_id) {
                        console.log('Лел');
                        option.selected = true;
                    }
                });

                // Обновляем "Статус материала"
                statusSelect.innerHTML = ''; // Очистить существующие опции
                data.statuses.forEach(function (status) {
                    const option = document.createElement('option');
                    option.value = status.id;
                    option.textContent = status.name;
                    statusSelect.appendChild(option);
                    // Устанавливаем текущий статус, если он совпадает с переданным
                    if (isFirstLoad && (status.id == data.current_status_id.replace(/^"(.+)"$/, '$1'))) {
                        console.log('условие выполнено');
                        option.selected = true;
                    }
                });
                isFirstLoad = false;
            });
        }
    });

    // Если страница уже была загружена с выбранным типом ткани
    if (fabricTypeSelect.value) {
        fabricTypeSelect.dispatchEvent(new Event('change'));
    }
});
