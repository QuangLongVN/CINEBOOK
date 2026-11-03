
require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const {
    sql,
    connectionString,
    connectDatabase
} = require("./db");

const app = express();
const PORT = 3000;

// ========================================
// 1. KIỂM TRA THƯ MỤC ẢNH
// ========================================

const imageFolder = path.join(__dirname, "Ảnh");

console.log("Thư mục ảnh:", imageFolder);
console.log(
    "Ảnh 1 có tồn tại:",
    fs.existsSync(path.join(imageFolder, "1.png"))
);

// ========================================
// 2. PHỤC VỤ ẢNH PHIM VÀ BANNER
// ========================================

// Đặt trước các API và route khác
// PHỤC VỤ ẢNH PHIM VÀ BANNER
app.use((req, res, next) => {
    let url;

    try {
        url = decodeURIComponent(req.path);
    } catch (error) {
        return res.sendStatus(400);
    }

    const match = url.match(/^\/Ảnh\/(1|2|3|4|5|6|7|8|Banner)\.png$/);

    if (match) {
        const filename = match[1] + ".png";

        return res.sendFile(
            path.join(__dirname, "Ảnh", filename)
        );
    }

    next();
});

// ========================================
// 3. PHỤC VỤ HTML, CSS, JAVASCRIPT
// ========================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/style.css", (req, res) => {
    res.sendFile(path.join(__dirname, "style.css"));
});

app.get("/script.js", (req, res) => {
    res.sendFile(path.join(__dirname, "script.js"));
});

// ========================================
// 4. MIDDLEWARE
// ========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// 5. SESSION
// ========================================

if (
    !process.env.SESSION_SECRET ||
    process.env.SESSION_SECRET.length < 32
) {
    console.error(
        "SESSION_SECRET phải có ít nhất 32 ký tự trong .env"
    );
    process.exit(1);
}

app.use(session({
    name: "cinema.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ========================================
// 6. HÀM TRUY VẤN SQL SERVER
// ========================================

function querySQL(query, params = []) {
    return new Promise((resolve, reject) => {
        sql.query(
            connectionString,
            query,
            params,
            (error, rows) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(rows);
                }
            }
        );
    });
}

// ========================================
// 7. KIỂM TRA BACKEND
// ========================================

app.get("/api/hello", (req, res) => {
    res.json({
        message: "Backend CINEMA hoạt động!"
    });
});

// ========================================
// 8. LẤY DANH SÁCH PHIM
// ========================================

app.get("/api/movies", async (req, res) => {
    try {
        const movies = await querySQL(`
            SELECT
                MovieID,
                Title,
                Genre,
                Duration,
                Description,
                PosterURL,
                Status
            FROM Movies
            ORDER BY MovieID
        `);

        res.json(movies);

    } catch (error) {
        console.error("Lỗi lấy phim:", error);

        res.status(500).json({
            message: "Không thể tải danh sách phim!"
        });
    }
});

// ========================================
// 9. ĐĂNG KÝ TÀI KHOẢN
// ========================================

app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            password.length < 8
        ) {
            return res.status(400).json({
                message: "Thông tin không hợp lệ hoặc mật khẩu dưới 8 ký tự!"
            });
        }

        const fullName = name.trim();
        const userEmail = email.trim().toLowerCase();

        if (
            fullName.length > 100 ||
            userEmail.length > 255 ||
            password.length > 72 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)
        ) {
            return res.status(400).json({
                message: "Họ tên, email hoặc mật khẩu không hợp lệ!"
            });
        }

        const existing = await querySQL(
            "SELECT UserID FROM Users WHERE Email = ?",
            [userEmail]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: "Email đã được đăng ký!"
            });
        }

        const hash = await bcrypt.hash(password, 10);

        await querySQL(
            `INSERT INTO Users
             (FullName, Email, PasswordHash)
             VALUES (?, ?, ?)`,
            [fullName, userEmail, hash]
        );

        res.status(201).json({
            message: "Đăng ký thành công!"
        });

    } catch (error) {
        console.error("Lỗi đăng ký:", error);

        if (
            String(error.message).includes("2601") ||
            String(error.message).includes("2627")
        ) {
            return res.status(409).json({
                message: "Email đã được đăng ký!"
            });
        }

        res.status(500).json({
            message: "Đăng ký thất bại!"
        });
    }
});

// ========================================
// 10. ĐĂNG NHẬP
// ========================================

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Vui lòng nhập email và mật khẩu!"
            });
        }

        const users = await querySQL(
            `SELECT
                UserID,
                FullName,
                Email,
                PasswordHash,
                Role
             FROM Users
             WHERE Email = ?`,
            [email.trim().toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Email hoặc mật khẩu không đúng!"
            });
        }

        const user = users[0];

        const valid = await bcrypt.compare(
            password,
            user.PasswordHash
        );

        if (!valid) {
            return res.status(401).json({
                message: "Email hoặc mật khẩu không đúng!"
            });
        }

        const userData = {
            id: user.UserID,
            name: user.FullName,
            email: user.Email,
            role: user.Role
        };

        req.session.regenerate(error => {
            if (error) {
                console.error(error);

                return res.status(500).json({
                    message: "Không thể tạo phiên đăng nhập!"
                });
            }

            req.session.user = userData;

            req.session.save(error => {
                if (error) {
                    console.error(error);

                    return res.status(500).json({
                        message: "Không thể lưu phiên đăng nhập!"
                    });
                }

                res.json({
                    message: "Đăng nhập thành công!",
                    user: userData
                });
            });
        });

    } catch (error) {
        console.error("Lỗi đăng nhập:", error);

        res.status(500).json({
            message: "Đăng nhập thất bại!"
        });
    }
});

// ========================================
// 11. THÔNG TIN NGƯỜI DÙNG
// ========================================

app.get("/api/me", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            message: "Bạn chưa đăng nhập!"
        });
    }

    res.json({
        user: req.session.user
    });
});

// ========================================
// 12. ĐĂNG XUẤT
// ========================================

app.post("/api/logout", (req, res) => {
    req.session.destroy(error => {
        if (error) {
            console.error(error);

            return res.status(500).json({
                message: "Đăng xuất thất bại!"
            });
        }

        res.clearCookie("cinema.sid");

        res.json({
            message: "Đăng xuất thành công!"
        });
    });
});

// ========================================
// 13. XỬ LÝ API KHÔNG TỒN TẠI
// ========================================

app.use("/api", (req, res) => {
    res.status(404).json({
        message: "API không tồn tại!"
    });
});

// ========================================
// 14. KHỞI ĐỘNG SERVER
// ========================================

connectDatabase();

app.listen(PORT, () => {
    console.log("==============================");
    console.log("Backend CINEMA đã khởi động!");
    console.log("http://localhost:" + PORT);
    console.log("==============================");
});
