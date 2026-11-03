
const sql = require("msnodesqlv8");

const connectionString =
    "Driver={ODBC Driver 17 for SQL Server};" +
    "Server=BONONG\\SQLEXPRESS;" +
    "Database=CINEBOOK;" +
    "Trusted_Connection=Yes;";

function connectDatabase() {
    sql.query(
        connectionString,
        "SELECT DB_NAME() AS DatabaseName",
        (error, rows) => {
            if (error) {
                console.error(
                    "Kết nối SQL Server thất bại:",
                    error.message
                );
            } else {
                console.log(
                    "Kết nối SQL Server thành công:",
                    rows[0].DatabaseName
                );
            }
        }
    );
}

module.exports = {
    sql,
    connectionString,
    connectDatabase
};
