const delete_modal = new bootstrap.Modal(document.getElementById('deleteModal'));
const delete_btn = document.getElementById('delete');
delete_btn.addEventListener('click', function() {
    delete_modal.hide(); // Закрываем модальное окно

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
