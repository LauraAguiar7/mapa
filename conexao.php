<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = "localhost";
$port = "5433";
$dbname = "Mapa";
$user = "postgres";
$password = "lam05";

$conn_string = "host=$host port=$port dbname=$dbname user=$user password=$password";

$conexao = pg_connect($conn_string);

if (!$conexao) {
    die("Erro de conexão com o banco PostgreSQL: " . pg_last_error());
}
?>
