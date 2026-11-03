
// ========================================
// CHUYỂN TRANG
// ========================================

let currentUser = null;

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.add("hidden");
    });

    const page = document.getElementById(pageId);

    if (page) {
        page.classList.remove("hidden");
        window.scrollTo(0, 0);
    }

    document.getElementById("dropdown").classList.add("hidden");
}

// Nút chuyển trang
document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", event => {
        event.preventDefault();

        const target = button.dataset.page;

        if ((target === "profile" || target === "tickets")
            && !currentUser) {
            showPage("login");
            return;
        }

        showPage(target);
    });
});

// Thanh menu
document.getElementById("navMovies").addEventListener(
    "click",
    event => {
        event.preventDefault();
        showPage("home");
        document.getElementById("now-showing").scrollIntoView();
    }
);

document.getElementById("navSchedule").addEventListener(
    "click",
    event => {
        event.preventDefault();
    }
);

document.getElementById("navCinema").addEventListener(
    "click",
    event => {
        event.preventDefault();
        showPage("home");
        document.getElementById("footer").scrollIntoView();
    }
);

// ========================================
// CẬP NHẬT NGƯỜI DÙNG
// ========================================

function updateUserUI(user) {
    currentUser = user;

    const guestMenu = document.getElementById("guestMenu");
    const userMenu = document.getElementById("userMenu");

    if (user) {
        guestMenu.classList.add("hidden");
        userMenu.classList.remove("hidden");

        document.getElementById("welcomeUser").textContent =
            "Xin chào, " + user.name;

        document.getElementById("profileName").textContent =
            "Họ tên: " + user.name;

        document.getElementById("profileEmail").textContent =
            "Email: " + user.email;
    } else {
        guestMenu.classList.remove("hidden");
        userMenu.classList.add("hidden");

        document.getElementById("welcomeUser").textContent = "";
        document.getElementById("profileName").textContent = "";
        document.getElementById("profileEmail").textContent = "";
    }
}

// Menu tài khoản
document.getElementById("userButton").addEventListener(
    "click",
    () => {
        document.getElementById("dropdown")
            .classList.toggle("hidden");
    }
);

// ========================================
// ĐĂNG KÝ
// ========================================

document.getElementById("registerForm").addEventListener(
    "submit",
    async event => {
        event.preventDefault();

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const errorBox = document.getElementById("registerError");
        errorBox.textContent = "";

        if (password !== confirmPassword) {
            errorBox.textContent = "Mật khẩu xác nhận không khớp!";
            return;
        }

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                errorBox.textContent = data.message;
                return;
            }

            alert("Đăng ký thành công!");

            document.getElementById("registerForm").reset();
            showPage("login");

        } catch (error) {
            console.error(error);
            errorBox.textContent = "Không thể kết nối Backend!";
        }
    }
);

// ========================================
// ĐĂNG NHẬP
// ========================================

document.getElementById("loginForm").addEventListener(
    "submit",
    async event => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        const errorBox = document.getElementById("loginError");

        errorBox.textContent = "";

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                errorBox.textContent = data.message;
                return;
            }

            updateUserUI(data.user);

            document.getElementById("loginPassword").value = "";
            showPage("home");

            alert("Đăng nhập thành công!");

        } catch (error) {
            console.error(error);
            errorBox.textContent = "Không thể kết nối Backend!";
        }
    }
);

// ========================================
// KIỂM TRA SESSION
// ========================================

async function checkLogin() {
    try {
        const response = await fetch("/api/me", {
            credentials: "same-origin"
        });

        if (response.ok) {
            const data = await response.json();
            updateUserUI(data.user);
        } else {
            updateUserUI(null);
        }
    } catch (error) {
        console.error(error);
        updateUserUI(null);
    }
}

// ========================================
// ĐĂNG XUẤT
// ========================================

document.getElementById("logoutButton").addEventListener(
    "click",
    async () => {
        try {
            const response = await fetch("/api/logout", {
                method: "POST",
                credentials: "same-origin"
            });

            if (!response.ok) {
                alert("Đăng xuất thất bại!");
                return;
            }

            updateUserUI(null);
            showPage("home");

            alert("Đăng xuất thành công!");

        } catch (error) {
            console.error(error);
            alert("Không thể kết nối Backend!");
        }
    }
);

// ========================================
// TẠO THẺ PHIM
// ========================================

function createMovieCard(movie) {
    const card = document.createElement("article");
    card.className = "movie-card";

    const poster = document.createElement("img");

    // ĐƯỜNG DẪN ẢNH ĐÚNG VỚI THƯ MỤC CỦA BẠN
    poster.src = "Ảnh/" + movie.MovieID + ".png";
    console.log("Đường dẫn ảnh:", poster.src);
    poster.alt = movie.Title;

    const info = document.createElement("div");
    info.className = "movie-info";

    const title = document.createElement("h3");
    title.textContent = movie.Title;

    const genre = document.createElement("p");
    genre.textContent = "Thể loại: " +
        (movie.Genre || "Đang cập nhật");

    const duration = document.createElement("p");
    duration.textContent = "Thời gian: " +
        (movie.Duration
            ? movie.Duration + " phút"
            : "Đang cập nhật");

    const description = document.createElement("p");
    description.className = "movie-description";
    description.textContent = movie.Description || "";

    const button = document.createElement("button");
    button.type = "button";

    const status = String(movie.Status || "").toLowerCase();
    const isShowing = status === "showing";

    button.className = isShowing
        ? "btn btn-red"
        : "btn btn-outline";

    button.textContent = isShowing
        ? "Đặt vé ngay"
        : "Xem chi tiết";

    button.addEventListener("click", () => {
        if (!isShowing) {
            alert(movie.Description || "Đang cập nhật!");
            return;
        }

        if (!currentUser) {
            alert("Vui lòng đăng nhập để đặt vé!");
            showPage("login");
            return;
        }

        alert("Chức năng đặt vé đang được phát triển.");
    });

    info.append(title, genre, duration, description, button);
    card.append(poster, info);

    return card;
}

// ========================================
// LẤY PHIM TỪ SQL SERVER
// ========================================

async function loadMovies() {
    const showing = document.getElementById("nowShowingMovies");
    const upcoming = document.getElementById("upcomingMovies");

    try {
        const response = await fetch("/api/movies");

        if (!response.ok) {
            throw new Error("Lỗi API: " + response.status);
        }

        const movies = await response.json();

        showing.replaceChildren();
        upcoming.replaceChildren();

        movies.forEach(movie => {
            const card = createMovieCard(movie);
            const status = String(movie.Status || "").toLowerCase();

            if (status === "showing") {
                showing.appendChild(card);
            } else if (status === "upcoming") {
                upcoming.appendChild(card);
            }
        });

        if (!showing.children.length) {
            showing.textContent = "Chưa có phim đang chiếu.";
        }

        if (!upcoming.children.length) {
            upcoming.textContent = "Chưa có phim sắp chiếu.";
        }

    } catch (error) {
        console.error("Lỗi tải phim:", error);

        showing.textContent = "Không thể tải phim đang chiếu.";
        upcoming.textContent = "Không thể tải phim sắp chiếu.";
    }
}

// ========================================
// BANNER
// ========================================

document.getElementById("bannerBooking").addEventListener(
    "click",
    () => {
        showPage("home");
        document.getElementById("now-showing").scrollIntoView();
    }
);

document.getElementById("trailerButton").addEventListener(
    "click",
    () => {
        alert("Trailer đang cập nhật!");
    }
);

// ========================================
// KHỞI ĐỘNG
// ========================================

checkLogin();
loadMovies();
