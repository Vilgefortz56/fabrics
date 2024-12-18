const stage = new Konva.Stage({
    container: 'canvasContainer',
    width: 1300,
    height: 750,
});
let isFirstLoad = true;

let currentArea = document.getElementById('area-data').textContent;
document.getElementById('inputArea').value = parseFloat(currentArea.replace(',', '.'));
const currentViewId = document.getElementById('viewid-data').textContent;
const currentStatusId = document.getElementById('status-data').textContent;

let gridLayer = null;
let contentLayer = null;
let lineLabelMap = null;


function saveScene() {
    gridLayer.setAttr('gridSize', gridSize);
    const gridLayerJSON = JSON.parse(gridLayer.toJSON());
    const contentLayerJSON = JSON.parse(contentLayer.toJSON());

    // Генерируем Map как массив объектов
    const mapArray = Array.from(lineLabelMap.entries()).map(([line, label]) => ({
        lineId:  line,
        labelId: label,
    }));
    // Сохраняем всё в один объект
    const sceneJSON = {
        gridLayer: gridLayerJSON,
        contentLayer: contentLayerJSON,
        lineLabelMap: mapArray,
    };

    return sceneJSON;
}

function loadScene() {
    const sceneJSON = document.getElementById('canvas-data').textContent;
    const savedScene = JSON.parse(JSON.parse(sceneJSON));
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
        lineLabelMap.set(lineId, labelId);
    });
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

    form.addEventListener('submit', function() {
        // Преобразуем данные canvas в JSON и записываем в скрытое поле
        const serializedData = saveScene();
        hiddenCanvasDataInput.value = JSON.stringify(serializedData);
        let imageDataURL = stage.toDataURL({
            mimeType: 'image/png', // Вы можете изменить на 'image/jpeg', если нужно
            quality: 1,           // Качество (для JPEG)
            pixelRatio: 1,        // Увеличение разрешения
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
