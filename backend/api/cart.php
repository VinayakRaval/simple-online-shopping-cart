<?php
header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once("../database.php");

$method = $_SERVER["REQUEST_METHOD"];
$action = $_GET["action"] ?? "";
$user_id = $_GET["user_id"] ?? 0;

// Utility functions
function send($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function getBody() {
    return json_decode(file_get_contents("php://input"), true);
}

// ✅ Handle OPTIONS (preflight)
if ($method === "OPTIONS") {
    http_response_code(200);
    exit;
}

// ✅ VIEW CART — GET /api/cart.php?user_id={id}
if ($method === "GET" && $user_id) {
    $pdo = getDB();
    $stmt = $pdo->prepare("
        SELECT c.product_id, c.quantity, p.name, p.price, p.image
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    ");
    $stmt->execute([$user_id]);
    send($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// ✅ ADD ITEM — POST /api/cart.php?action=add
if ($method === "POST" && $action === "add") {
    $data = getBody();
    $user_id = intval($data["user_id"] ?? 0);
    $product_id = intval($data["product_id"] ?? 0);
    $quantity = intval($data["quantity"] ?? 1);

    if (!$user_id || !$product_id) send(["error" => "Missing user_id or product_id"], 400);

    $pdo = getDB();

    // If already exists, increase quantity
    $stmt = $pdo->prepare("SELECT quantity FROM cart WHERE user_id = ? AND product_id = ?");
    $stmt->execute([$user_id, $product_id]);
    $existing = $stmt->fetchColumn();

    if ($existing) {
        $newQty = $existing + $quantity;
        $pdo->prepare("UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?")
            ->execute([$newQty, $user_id, $product_id]);
    } else {
        $pdo->prepare("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)")
            ->execute([$user_id, $product_id, $quantity]);
    }

    send(["success" => true, "message" => "Product added to cart"]);
}

// ✅ UPDATE ITEM — POST /api/cart.php?action=update
if ($method === "POST" && $action === "update") {
    $data = getBody();
    $user_id = intval($data["user_id"] ?? 0);
    $product_id = intval($data["product_id"] ?? 0);
    $quantity = intval($data["quantity"] ?? 1);

    if (!$user_id || !$product_id) send(["error" => "Missing parameters"], 400);

    $pdo = getDB();
    $stmt = $pdo->prepare("UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?");
    $stmt->execute([$quantity, $user_id, $product_id]);

    send(["success" => true, "message" => "Cart updated"]);
}

// ✅ REMOVE ITEM — POST /api/cart.php?action=remove
if ($method === "POST" && $action === "remove") {
    $data = getBody();
    $user_id = intval($data["user_id"] ?? 0);
    $product_id = intval($data["product_id"] ?? 0);

    if (!$user_id || !$product_id) send(["error" => "Missing parameters"], 400);

    $pdo = getDB();
    $stmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ? AND product_id = ?");
    $stmt->execute([$user_id, $product_id]);

    send(["success" => true, "message" => "Item removed"]);
}

// ✅ DEFAULT — Invalid route
send(["error" => "Invalid API route or method"], 404);
