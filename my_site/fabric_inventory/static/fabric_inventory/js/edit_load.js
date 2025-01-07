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
const currentMaterialId = document.getElementById('materialid-data').textContent;

let gridLayer = null;
let contentLayer = null;
let lineLabelMap = null;

function saveScene() {
    gridLayer.setAttr('gridSize', gridSize);
    const gridLayerJSON = JSON.parse(gridLayer.toJSON());
    const contentLayerJSON = JSON.parse(contentLayer.toJSON());
    const mapArray = Array.from(lineLabelMap.entries()).map(([line, label]) => ({
        lineId:  line,
        labelId: label,
    }));
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
    stage.findOne('#gridLayer')?.destroy();
    stage.findOne('#contentLayer')?.destroy();
    stage.add(gridLayer);
    stage.add(contentLayer);
    lineLabelMap = new Map();
    savedScene.lineLabelMap.forEach(({ lineId, labelId }) => {
        lineLabelMap.set(lineId, labelId);
    });
    contentLayer.draw();
}

document.addEventListener("DOMContentLoaded",  loadScene);
document.addEventListener('DOMContentLoaded', async function () {
    const fabricTypeSelect = document.querySelector('[name="fabric_type"]');
    const fabricViewSelect = document.querySelector('[name="fabric_view"]');
    const fabricMaterialSelect = document.querySelector('[name="fabric_material"]');
    const statusSelect = document.querySelector('[name="status"]');
    const form = document.getElementById('fabricEditForm');
    const hiddenCanvasDataInput = document.getElementById('canvasData');

    if (!form || !hiddenCanvasDataInput) {
        console.error("Form or hidden input not found.");
        return;
    }

    form.addEventListener('submit', function () {
        const serializedData = saveScene();
        hiddenCanvasDataInput.value = JSON.stringify(serializedData);
        const imageDataURL = stage.toDataURL({
            mimeType: 'image/png',
            quality: 1,
            pixelRatio: 1,
        });
        document.getElementById('editImage').value = imageDataURL;
    });

    async function updateFabricViews() {
        const fabricTypeId = fabricTypeSelect.value;
        if (!fabricTypeId) return;

        const response = await fetch(`/get_fabric_views/${fabricTypeId}/?current_view_id=${currentViewId}&current_status_id=${currentStatusId}`);
        const data = await response.json();

        fabricViewSelect.innerHTML = '';
        data.views.forEach(fabricView => {
            const option = document.createElement('option');
            option.value = fabricView.id;
            option.textContent = fabricView.name;
            fabricViewSelect.appendChild(option);
            if (isFirstLoad && fabricView.id == data.current_view_id) {
                option.selected = true;
            }
        });

        statusSelect.innerHTML = '';
        data.statuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status.id;
            option.textContent = status.name;
            statusSelect.appendChild(option);
            if (isFirstLoad && status.id == data.current_status_id.replace(/^"(.+)"$/, '$1')) {
                option.selected = true;
            }
        });

        if (fabricViewSelect.value) {
            await updateFabricMaterials();
        }
    }

    async function updateFabricMaterials() {
        const fabricViewId = fabricViewSelect.value;
        if (!fabricViewId) return;

        const response = await fetch(`/get_fabric_materials/${fabricViewId}/?current_material_id=${currentMaterialId}`);
        const data = await response.json();

        fabricMaterialSelect.innerHTML = '';
        data.materials.forEach(material => {
            const option = document.createElement('option');
            option.value = material.id;
            option.textContent = material.name;
            fabricMaterialSelect.appendChild(option);
            if (isFirstLoad && material.id == data.current_material_id) {
                option.selected = true;
            }
        });
    }

    fabricTypeSelect.addEventListener('change', async function () {
        await updateFabricViews();
        isFirstLoad = false;
    });

    fabricViewSelect.addEventListener('change', async function () {
        await updateFabricMaterials();
    });

    if (fabricTypeSelect.value) {
        await updateFabricViews();
    }
    isFirstLoad = false;
});
