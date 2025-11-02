<?php
// backend/api/products.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once("../database.php");

// ✅ Handle fetching all products or one by ID
if ($_SERVER["REQUEST_METHOD"] === "GET") {
    // If "id" is passed → fetch specific product
    if (isset($_GET["id"])) {
        $id = intval($_GET["id"]);
        $stmt = $conn->prepare("SELECT id, name, price, category, description, image FROM products WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $product = $result->fetch_assoc();

        if ($product) {
            echo json_encode($product);
        } else {
            echo json_encode(["error" => "Product not found"]);
        }
        exit;
    }

    // Otherwise → list all products
    $result = $conn->query("SELECT id, name, price, category, description, image FROM products ORDER BY id DESC");
    $products = [];

    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }

    echo json_encode($products);
    exit;
}

// If method not allowed
http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);
