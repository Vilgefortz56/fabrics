const delete_modal = new bootstrap.Modal(document.getElementById('deleteModal'));
const delete_btn = document.getElementById('confirmDelete');

delete_modal.addEventListener('click', function() {
    delete_modal.hide(); // Закрываем модальное окно

});

// Обработчик кнопки удаления данных
document.getElementById('editBtn').addEventListener('click', function(event) {
    event.preventDefault(); // Остановить стандартную отправку формы
    console.log('kek');
    delete_modal.show();
});

// const edit_modal = new bootstrap.Modal(document.getElementById('deleteModal'));
// const edit_btn = document.getElementById('confirmDelete');