const API_KEY = '3a511289-43b6-49a8-82f3-00decaa84995';
const BASE_URL = 'https://exam-api-courses.std-900.ist.mospolytech.ru/api';

let orders = [];
let courses = [];
let tutors = [];
let currentPage = 1;
const itemsPerPage = 5;

document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([fetchCourses(), fetchTutors()]);
    fetchOrders();
    
    document.getElementById('edit-order-form').addEventListener('submit', saveEditedOrder);
});

async function fetchCourses() {
    const res = await fetch(`${BASE_URL}/courses?api_key=${API_KEY}`);
    courses = await res.json();
}

async function fetchTutors() {
    const res = await fetch(`${BASE_URL}/tutors?api_key=${API_KEY}`);
    tutors = await res.json();
}

async function fetchOrders() {
    try {
        const res = await fetch(`${BASE_URL}/orders?api_key=${API_KEY}`);
        orders = await res.json();
        orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        renderOrders();
    } catch (error) {
        showAlert('Ошибка загрузки заявок', 'danger');
    }
}

function renderOrders() {
    const table = document.getElementById('orders-table');
    table.innerHTML = '';
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = orders.slice(start, end);

    if (pageItems.length === 0) {
        table.innerHTML = '<tr><td colspan="5" class="text-center p-4">Заявок пока нет</td></tr>';
        return;
    }

    pageItems.forEach((order, index) => {
        const course = courses.find(c => c.id === order.course_id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${start + index + 1}</td>
            <td>${course ? course.name : 'Неизвестный курс'}</td>
            <td>${order.date_start}</td>
            <td>${order.price} ₽</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="openViewModal(${order.id})">👁️</button>
                    <button class="btn btn-outline-warning" onclick="openEditModal(${order.id})">✏️</button>
                    <button class="btn btn-outline-danger" onclick="openDeleteModal(${order.id})">🗑️</button>
                </div>
            </td>
        `;
        table.appendChild(tr);
    });
    renderPagination();
}

function renderPagination() {
    const pagination = document.getElementById('orders-pagination');
    pagination.innerHTML = '';
    const totalPages = Math.ceil(orders.length / itemsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`;
        pagination.appendChild(li);
    }
}

window.changePage = (page) => {
    currentPage = page;
    renderOrders();
};

window.openViewModal = (id) => {
    const order = orders.find(o => o.id === id);
    const course = courses.find(c => c.id === order.course_id);
    const tutor = tutors.find(t => t.id === order.tutor_id);
    
    document.getElementById('view-modal-body').innerHTML = `
        <p><strong>Курс:</strong> ${course?.name}</p>
        <p><strong>Преподаватель:</strong> ${tutor?.name}</p>
        <p><strong>Дата начала:</strong> ${order.date_start}</p>
        <p><strong>Время:</strong> ${order.time_start}</p>
        <p><strong>Студентов:</strong> ${order.persons}</p>
        <p><strong>Итоговая цена:</strong> ${order.price} ₽</p>
        <p><strong>Создано:</strong> ${new Date(order.created_at).toLocaleString()}</p>
    `;
    new bootstrap.Modal(document.getElementById('viewModal')).show();
};

window.openEditModal = (id) => {
    const order = orders.find(o => o.id === id);
    document.getElementById('edit-order-id').value = order.id;
    document.getElementById('edit-date').value = order.date_start;
    document.getElementById('edit-persons').value = order.persons;
    
    new bootstrap.Modal(document.getElementById('editModal')).show();
};

async function saveEditedOrder(e) {
    e.preventDefault();
    const id = document.getElementById('edit-order-id').value;
    const data = {
        date_start: document.getElementById('edit-date').value,
        persons: parseInt(document.getElementById('edit-persons').value)
    };

    try {
        const res = await fetch(`${BASE_URL}/orders/${id}?api_key=${API_KEY}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if (res.ok) {
            showAlert('Заявка обновлена', 'success');
            bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
            fetchOrders();
        }
    } catch (error) {
        showAlert('Ошибка при сохранении', 'danger');
    }
}

let orderToDelete = null;
window.openDeleteModal = (id) => {
    orderToDelete = id;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
};

document.getElementById('confirm-delete-btn').onclick = async () => {
    try {
        const res = await fetch(`${BASE_URL}/orders/${orderToDelete}?api_key=${API_KEY}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            showAlert('Заявка удалена', 'warning');
            bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
            fetchOrders();
        }
    } catch (error) {
        showAlert('Ошибка при удалении', 'danger');
    }
};

function showAlert(msg, type) {
    const container = document.getElementById('alerts-container');
    container.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
    setTimeout(() => container.innerHTML = '', 4000);
}