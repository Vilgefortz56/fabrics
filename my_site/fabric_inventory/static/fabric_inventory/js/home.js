const delete_modal = new bootstrap.Modal(document.getElementById('deleteModal'));
const delete_btn = document.getElementById('delete');
console.log(delete_modal);
console.log(delete_btn);
delete_btn.addEventListener('click', function() {
    delete_modal.hide(); // Закрываем модальное окно

});

document.getElementById('deleteBtn').addEventListener('click', function(event) {
    event.preventDefault(); // Остановить стандартную отправку формы
    console.log('kek');
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

const edit_btn = document.getElementById('editBtn');
console.log(edit_btn);
// Обработчик кнопки удаления данных
document.getElementById('editBtn').addEventListener('click', function(event) {
    event.preventDefault(); // Остановить стандартную отправку формы
    console.log('kek');
    delete_modal.show();
});

// const edit_modal = new bootstrap.Modal(document.getElementById('deleteModal'));
// const edit_btn = document.getElementById('confirmDelete');