<?php
// api/config/database.php

class Database {
    private $host = "db"; // Nombre del servicio en docker-compose
    private $db_name = "turucsac_db";
    private $username = "root";
    private $password = "rootpassword"; // Definido en docker-compose.yml
    public $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO("mysql:host=" . $this->host, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            $this->conn->exec("USE " . $this->db_name);
            $this->conn->exec("set names utf8mb4");
        } catch(PDOException $exception) {
            if ($exception->getCode() === 1049) {
                // Return server connection without selecting DB
            } else {
                echo "Error de Conexión: " . $exception->getMessage();
            }
        }

        return $this->conn;
    }

    public function getDbName() {
        return $this->db_name;
    }
}
?>
