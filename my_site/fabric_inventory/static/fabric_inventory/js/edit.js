let canvas = new fabric.Canvas('canvas');
let isFirstLoad = true;
console.log('Привет');
// Получение размеров canvas
let canvasWidth = canvas.getWidth();
let canvasHeight = canvas.getHeight();
// Восстановление canvas из JSON
function loadCanvas() {
    //let canvasData = document.getElementById('canvasData');
    let canvasData = document.getElementById('canvas-data').textContent;
    //canvasData = canvasData.value;
    // console.log(canvasData);
    // console.log("kek", JSON.parse(canvasData));
    if (canvasData) {
        canvas.loadFromJSON(JSON.parse(canvasData), canvas.renderAll.bind(canvas));
    } else {
        alert("No saved drawing found.");
    }
}

function renderCanvas() {
    canvas.renderAll();
}

document.addEventListener("DOMContentLoaded", loadCanvas);
//setTimeout(100);
document.addEventListener("DOMContentLoaded", renderCanvas);
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
        // Преобразуем данные canvas в JSON и записываем в скрытое поле
        const serializedCanvasData = JSON.stringify(canvas.toJSON());
        // console.log("Serialized canvas data for submission:", serializedCanvasData);
        hiddenCanvasDataInput.value = serializedCanvasData;

        // Проверка, что данные успешно записаны
        // console.log("Hidden canvas data input value:", hiddenCanvasDataInput.value);

        let imageDataURL = canvas.toDataURL({
            format: 'png',
            multiplier: 1 // Множитель для увеличения разрешения
        });
        // imageDataURL = imageDataURL.replace(/^data:image\/(png|jpeg);base64,/, "");
        // console.log(imageDataURL);
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
                    if (isFirstLoad && status.id == data.current_status_id) {
                        option.selected = true;
                    }
                });
            });
        }
    });

    // Если страница уже была загружена с выбранным типом ткани
    if (fabricTypeSelect.value) {
        fabricTypeSelect.dispatchEvent(new Event('change'));
    }
});
