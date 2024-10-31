const delete_modal = new bootstrap.Modal(document.getElementById('deleteModal'));
const delete_btn = document.getElementById('delete');
delete_btn.addEventListener('click', function() {
    delete_modal.hide(); // Закрываем модальное окно

});
function toggleNested(id) {
    const element = document.getElementById(id);
    console.log(element);
    if (element.style.display === "none" || element.style.display === "") {
        element.style.display = "block";  // Показываем подкатегории
    } else {
        element.style.display = "none";   // Скрываем подкатегории
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const fabricTypes = document.querySelectorAll(".fabric-type");

    fabricTypes.forEach((type) => {
      type.addEventListener("change", function () {
        const kindGroup = document.getElementById(`${type.value}-kinds`);

        // Show or hide the fabric kinds based on whether the checkbox is checked
        if (type.checked) {
          kindGroup.classList.remove("d-none");
        } else {
          kindGroup.classList.add("d-none");
          // Uncheck all kinds when the type is unchecked
          kindGroup.querySelectorAll("input[type='checkbox']").forEach((kind) => {
            kind.checked = false;
          });
        }
      });
    });
  });

document.getElementById('deleteBtn').addEventListener('click', function(event) {
    event.preventDefault(); // Остановить стандартную отправку формы
    delete_modal.show();
});

// Находим кнопку удаления в модальном окне
document.getElementById('delete').addEventListener('click', function() {
    // Ищем форму, которая уже привязана к кнопке удаления
    var form = document.getElementById('deleteForm');  // ID формы, которую будем отправлять
    if (form) {
        form.submit();  // Отправляем форму
    }
});
