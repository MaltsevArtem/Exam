const API_KEY = '3a511289-43b6-49a8-82f3-00decaa84995';
const BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru/api';

let allCourses = [];
let filteredCourses = [];
let allTutors = [];
let currentPage = 1;
const itemsPerPage = 5;

let selectedCourse = null;
let selectedTutor = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchCourses();
    fetchTutors();
    initMap();
    setupEventListeners();
});

async function fetchCourses() {
    try {
        const response = await fetch(`${BASE_URL}/courses?api_key=${API_KEY}`);
        allCourses = await response.json();
        filteredCourses = [...allCourses];
        renderCourses();
    } catch (error) {
        showAlert('Ошибка при загрузке курсов', 'danger');
    }
}

async function fetchTutors() {
    try {
        const response = await fetch(`${BASE_URL}/tutors?api_key=${API_KEY}`);
        allTutors = await response.json();
        renderTutors(allTutors);
        fillTutorLanguages();
    } catch (error) {
        showAlert('Ошибка при загрузке репетиторов', 'danger');
    }
}

function renderCourses() {
    const tableBody = document.getElementById('courses-table');
    tableBody.innerHTML = '';
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredCourses.slice(start, end);

    pageItems.forEach(course => {
        const tr = document.createElement('tr');
        if (selectedCourse?.id === course.id) tr.classList.add('selected-row');
        
        tr.innerHTML = `
            <td>${course.name}</td>
            <td><span class="badge bg-info text-dark">${course.level}</span></td>
            <td><button class="btn btn-sm btn-outline-primary" onclick="selectCourse(${course.id})">Выбрать</button></td>
        `;
        tableBody.appendChild(tr);
    });
    renderPagination();
}

function renderPagination() {
    const pagination = document.getElementById('courses-pagination');
    pagination.innerHTML = '';
    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`;
        pagination.appendChild(li);
    }
}

window.changePage = (page) => {
    currentPage = page;
    renderCourses();
};

window.selectCourse = (id) => {
    selectedCourse = allCourses.find(c => c.id === id);
    renderCourses();
    checkShowOrderBtn();
};

window.selectTutor = (id) => {
    selectedTutor = allTutors.find(t => t.id === id);
    renderTutors(allTutors);
    checkShowOrderBtn();
};

function checkShowOrderBtn() {
    const btn = document.getElementById('open-order-btn');
    if (selectedCourse && selectedTutor) {
        btn.classList.remove('d-none');
    }
}

function calculateTotalCost() {
    if (!selectedCourse || !selectedTutor) return 0;

    const students = parseInt(document.getElementById('students-count').value) || 1;
    const startTime = document.getElementById('start-time').value;
    const startDate = new Date(document.getElementById('start-date').value);
    
    const feePerHour = selectedCourse.course_fee_per_hour;
    const totalHours = selectedCourse.total_length * selectedCourse.week_length;

    const day = startDate.getDay();
    const isWeekend = (day === 0 || day === 6);
    const weekendMultiplier = isWeekend ? 1.5 : 1;

    let timeSurcharge = 0;
    const hour = parseInt(startTime.split(':')[0]);
    if (hour >= 9 && hour <= 12) timeSurcharge = 400;
    else if (hour >= 18 && hour <= 20) timeSurcharge = 1000;

    let basePrice = ((feePerHour * totalHours * weekendMultiplier) + timeSurcharge) * students;

    const now = new Date();
    const monthLater = new Date();
    monthLater.setMonth(now.getMonth() + 1);
    if (startDate > monthLater) basePrice *= 0.9;

    if (students >= 5) basePrice *= 0.85;

    if (document.getElementById('opt-intensive')?.checked) basePrice *= 1.2;
    if (document.getElementById('opt-materials')?.checked) basePrice += (2000 * students);
    if (document.getElementById('opt-personalized')?.checked) basePrice += (1500 * selectedCourse.total_length);
    if (document.getElementById('opt-excursions')?.checked) basePrice *= 1.25;
    if (document.getElementById('opt-assessment')?.checked) basePrice += (300 * students);
    if (document.getElementById('opt-interactive')?.checked) basePrice *= 1.5;

    return Math.round(basePrice);
}

function initMap() {
    if (!window.ymaps) return;
    ymaps.ready(() => {
        const myMap = new ymaps.Map("map", {
            center: [55.7558, 37.6173],
            zoom: 11
        });

        const locations = [
            {coords: [55.7512, 37.6184], title: 'Библиотека им. Ленина', type: 'library'},
            {coords: [55.7602, 37.6105], title: 'Языковой клуб "Polyglot"', type: 'club'},
            {coords: [55.7415, 37.6200], title: 'Кафе "Лингвист"', type: 'cafe'}
        ];

        locations.forEach(loc => {
            const placemark = new ymaps.Placemark(loc.coords, {
                balloonContent: `<strong>${loc.title}</strong><br>Тип: ${loc.type}`
            });
            myMap.geoObjects.add(placemark);
        });
    });
}

function setupEventListeners() {
    document.getElementById('search-courses-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('course-name').value.toLowerCase();
        const level = document.getElementById('course-level').value;
        
        filteredCourses = allCourses.filter(c => 
            c.name.toLowerCase().includes(name) && 
            (level === "" || c.level === level)
        );
        currentPage = 1;
        renderCourses();
    });

    document.getElementById('open-order-btn').addEventListener('click', () => {
        if (!selectedCourse || !selectedTutor) return;

        document.getElementById('modal-course-name').value = selectedCourse.name;
        document.getElementById('modal-teacher-name').value = selectedTutor.name;
        document.getElementById('modal-duration').value = selectedCourse.total_length + " недель";
        
        const timeSelect = document.getElementById('start-time');
        timeSelect.innerHTML = `
            <option value="" disabled selected>Выберите время</option>
            <option value="09:00">09:00 - 11:00</option>
            <option value="12:00">12:00 - 14:00</option>
            <option value="18:00">18:00 - 20:00</option>
        `;
        timeSelect.disabled = false;

        generateOptionCheckboxes();
        
        const modal = new bootstrap.Modal(document.getElementById('orderModal'));
        modal.show();
    });

    document.getElementById('order-form').addEventListener('change', () => {
        const total = calculateTotalCost();
        document.getElementById('total-cost').textContent = total;
    });
    
    document.getElementById('order-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Попытка отправки формы...");

        const dateVal = document.getElementById('start-date').value;
        const timeVal = document.getElementById('start-time').value;

        if (!dateVal || !timeVal) {
            alert("Пожалуйста, выберите дату и время начала занятий");
            return;
        }

        const formData = {
            tutor_id: selectedTutor.id,
            course_id: selectedCourse.id,
            date_start: dateVal,
            time_start: timeVal,
            duration: selectedCourse.total_length,
            persons: parseInt(document.getElementById('students-count').value),
            price: calculateTotalCost(),
            early_registration: false,
            group_enrollment: parseInt(document.getElementById('students-count').value) >= 5,
            intensive_course: document.getElementById('opt-intensive')?.checked || false,
            supplementary: document.getElementById('opt-materials')?.checked || false,
            personalized: document.getElementById('opt-personalized')?.checked || false,
            excursions: document.getElementById('opt-excursions')?.checked || false,
            assessment: false,
            interactive: false
        };

        console.log("Данные для отправки:", formData);

        try {
            const response = await fetch(`${BASE_URL}/orders?api_key=${API_KEY}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                console.log("Успешный ответ от сервера");
                showAlert('Заявка успешно отправлена!', 'success');
                if (response.ok) {
    console.log("Успешный ответ от сервера");
    showAlert('Заявка успешно отправлена! Сейчас вы перейдете в личный кабинет...', 'success');
    
    bootstrap.Modal.getInstance(document.getElementById('orderModal')).hide();

    setTimeout(() => {
        window.location.href = 'cabinet.html';
    }, 2500);
}
                bootstrap.Modal.getInstance(document.getElementById('orderModal')).hide();
                selectedCourse = null;
                selectedTutor = null;
                document.getElementById('open-order-btn').classList.add('d-none');
                renderCourses();
                renderTutors(allTutors);
            } else {
                const errorData = await response.json();
                console.error("Ошибка сервера:", errorData);
                showAlert('Ошибка сервера: ' + (errorData.error || 'неизвестная ошибка'), 'danger');
            }
        } catch (error) {
            console.error("Ошибка сети:", error);
            showAlert('Ошибка связи с сервером. Проверьте интернет.', 'danger');
        }
    });
}

function generateOptionCheckboxes() {
    const container = document.getElementById('options-container');
    container.innerHTML = `
        <div class="col-md-6"><div class="form-check"><input class="form-check-input" type="checkbox" id="opt-intensive"><label class="form-check-label">Интенсивный курс (+20%)</label></div></div>
        <div class="col-md-6"><div class="form-check"><input class="form-check-input" type="checkbox" id="opt-materials"><label class="form-check-label">Учебные материалы (+2000/чел)</label></div></div>
        <div class="col-md-6"><div class="form-check"><input class="form-check-input" type="checkbox" id="opt-personalized"><label class="form-check-label">Индивидуальные занятия (+1500/нед)</label></div></div>
        <div class="col-md-6"><div class="form-check"><input class="form-check-input" type="checkbox" id="opt-excursions"><label class="form-check-label">Экскурсии (+25%)</label></div></div>
    `;
}

function showAlert(msg, type) {
    const container = document.getElementById('alerts-container');
    container.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show alert-fixed" role="alert">
        ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
    setTimeout(() => { if(container.firstChild) container.innerHTML = ''; }, 5000);
}

function renderTutors(tutorList) {
    const body = document.getElementById('tutors-table');
    body.innerHTML = '';
    tutorList.forEach(t => {
        const tr = document.createElement('tr');
        if (selectedTutor?.id === t.id) tr.classList.add('selected-row');
        tr.innerHTML = `
            <td><img src="https://via.placeholder.com/50" class="rounded-circle"></td>
            <td>${t.name}</td>
            <td>${t.languages_spoken.join(', ')}</td>
            <td>${t.language_level}</td>
            <td>${t.work_experience}</td>
            <td>${t.price_per_hour}</td>
            <td><button class="btn btn-sm btn-primary" onclick="selectTutor(${t.id})">Выбрать</button></td>
        `;
        body.appendChild(tr);
    });
}

function fillTutorLanguages() {
    const select = document.getElementById('tutor-lang');
    const langs = new Set();
    allTutors.forEach(t => t.languages_spoken.forEach(l => langs.add(l)));
    langs.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l; opt.textContent = l;
        select.appendChild(opt);
    });
}