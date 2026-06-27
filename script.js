document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. ПЛАВНЫЙ НЕОНОВЫЙ КУРСОР
    // ==========================================
    const dot = document.querySelector(".custom-cursor-dot");
    const outline = document.querySelector(".custom-cursor-outline");

    if (dot && outline && window.innerWidth > 768) {
        document.addEventListener("mousemove", (e) => {
            dot.style.opacity = "1";
            outline.style.opacity = "1";
            dot.style.left = `${e.clientX}px`;
            dot.style.top = `${e.clientY}px`;
            
            outline.animate({
                left: `${e.clientX}px`,
                top: `${e.clientY}px`
            }, { duration: 240, fill: "forwards" });
        });
        document.addEventListener("mouseleave", () => {
            dot.style.opacity = "0";
            outline.style.opacity = "0";
        });
    }

    // ==========================================
    // 2. АНИМАЦИЯ СКРОЛЛА (REVEAL)
    // ==========================================
    const revealTargets = document.querySelectorAll(".scroll-reveal");
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("scroll-reveal-active");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    revealTargets.forEach(target => revealObserver.observe(target));

    // ==========================================
    // 3. ФИЛЬТРАЦИЯ КЕЙСОВ ПОРТФОЛИО
    // ==========================================
    const filterButtons = document.querySelectorAll(".filter-btn");
    const portfolioCards = document.querySelectorAll(".portfolio-item-card");

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            filterButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            const filterValue = button.getAttribute("data-filter");
            portfolioCards.forEach(card => {
                const cat = card.getAttribute("data-category");
                if (filterValue === "all" || cat === filterValue) {
                    card.classList.remove("hide");
                } else {
                    card.classList.add("hide");
                }
            });
        });
    });

    // ==========================================
    // 4. ЖИВОЙ КАЛЬКУЛЯТОР-КОНФИГУРАТОР СТОИМОСТИ
    // ==========================================
    const tiles = document.querySelectorAll(".selector-tile");
    const checkTg = document.getElementById("addon-tg");
    const checkAnim = document.getElementById("addon-anim");
    const priceDisplay = document.getElementById("live-price-display");

    let currentBasePrice = 15000;
    let currentTypeName = "Лендинг / Промо";

    // Выбор плитки (тип сайта)
    tiles.forEach(tile => {
        tile.addEventListener("click", () => {
            tiles.forEach(t => t.classList.remove("active"));
            tile.classList.add("active");
            
            currentBasePrice = parseInt(tile.getAttribute("data-price"));
            currentTypeName = tile.querySelector("h4").textContent;
            calculateTotal();
        });
    });

    // Изменение чекбоксов
    checkTg.addEventListener("change", calculateTotal);
    checkAnim.addEventListener("change", calculateTotal);

    function calculateTotal() {
        let total = currentBasePrice;
        
        if (checkTg.checked) total += parseInt(checkTg.getAttribute("data-addon-price"));
        if (checkAnim.checked) total += parseInt(checkAnim.getAttribute("data-addon-price"));
        
        priceDisplay.textContent = total.toLocaleString("ru-RU");
    }

    // ==========================================
    // 5. ОТПРАВКА СФОРМИРОВАННОГО ТЗ В TELEGRAM
    // ==========================================
    const feedbackForm = document.getElementById("portfolio-interactive-form");
    const successUI = document.getElementById("form-success-state");
    const submitButton = document.getElementById("form-submit-trigger");
    const spinner = submitButton.querySelector(".spinner");
    const btnText = submitButton.querySelector(".btn-text");

    if (feedbackForm) {
        feedbackForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            btnText.textContent = "Упаковка пакета ТЗ...";
            spinner.classList.remove("hidden");
            submitButton.style.pointerEvents = "none";

            const clientPayload = {
                name: document.getElementById("client_name").value.trim(),
                contact: document.getElementById("client_contact").value.trim(),
                comment: document.getElementById("client_task").value.trim(),
                totalPrice: priceDisplay.textContent
            };

            // Собираем данные чекбоксов для ТЗ
            let integrations = [];
            if (checkTg.checked) integrations.push("Telegram Bot API");
            if (checkAnim.checked) integrations.push("UI-Анимации");
            const integrationsText = integrations.length > 0 ? integrations.join(", ") : "Нет";

            // --- НАСТРОЙКИ TELEGRAM API ---
            const BOT_TOKEN = "СЮДА_ВСТАВЬ_ТОКЕН_БОТА"; 
            const CHAT_ID = "СЮДА_ВСТАВЬ_СВОЙ_ЦИФРОВОЙ_ID"; 

            // Формируем красивое структурированное сообщение для Telegram
            const messageTemplate = `
📦 НОВЫЙ ЗАКАЗ: СКОНФИГУРИРОВАНО ТЗ
──────────────────
👤 Клиент: ${clientPayload.name}
📞 Контакт: ${clientPayload.contact}

⚙️ Тип системы: ${currentTypeName}
🔌 Интеграции: ${integrationsText}
📝 Комментарий: ${clientPayload.comment || "Не указан"}

💵 Итоговая стоимость: ${clientPayload.totalPrice} ₽
──────────────────
📡 Сформировано автоматически через UI-Скрипт.
            `.trim();

            try {
                const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: CHAT_ID,
                        text: messageTemplate,
                        parse_mode: "Markdown"
                    })
                });

                if (response.ok) {
                    feedbackForm.style.opacity = "0";
                    setTimeout(() => {
                        feedbackForm.classList.add("hidden-state");
                        successUI.classList.remove("hidden-state");
                    }, 300);
                } else {
                    throw new Error("API Response Error");
                }

            } catch (error) {
                console.error(error);
                btnText.textContent = "Критический сбой. Повторить?";
                spinner.classList.add("hidden");
                submitButton.style.pointerEvents = "auto";
                submitButton.style.background = "#ef4444";
            }
        });
    }
});
