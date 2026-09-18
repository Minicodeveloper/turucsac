<?php
// api/config/database.php

class Database {
    private $host;
    private $port;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        $this->host = getenv('DB_HOST') ?: $_ENV['DB_HOST'] ?? '127.0.0.1';
        $this->port = getenv('DB_PORT') ?: $_ENV['DB_PORT'] ?? '3307';
        $this->db_name = getenv('DB_NAME') ?: $_ENV['DB_NAME'] ?? 'turucsac_db';
        $this->username = getenv('DB_USER') ?: $_ENV['DB_USER'] ?? 'root';
        $this->password = getenv('DB_PASS') ?: $_ENV['DB_PASS'] ?? '';
    }

    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset=utf8mb4";
            $this->conn = new PDO($dsn, $this->username, $this->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        } catch (PDOException $exception) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error de conexión a la BD: ' . $exception->getMessage(),
            ]);
            exit;
        }

        return $this->conn;
    }

    public function getDbName() {
        return $this->db_name;
    }
}
?>