const delete_modal = new bootstrap.Modal(document.getElementById('deleteModal'));
const delete_btn = document.getElementById('delete');
delete_btn.addEventListener('click', function() {
    delete_modal.hide(); 

});
function toggleNested(id) {
    const element = document.getElementById(id);
    if (element.style.display === "none" || element.style.display === "") {
        element.style.display = "block";  
    } else {
        element.style.display = "none";   
    }
}

document.getElementById('deleteBtn').addEventListener('click', function(event) {
    event.preventDefault(); 
    delete_modal.show();
});


document.getElementById('delete').addEventListener('click', function() {
    var form = document.getElementById('deleteForm');  
    if (form) {
        form.submit();  
    }
});
