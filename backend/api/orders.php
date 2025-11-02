<?php
header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once __DIR__ . '/../database.php';
session_start();

// 🔐 Require login
if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        // Place a new order
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['address']) || trim($data['address']) === "") {
            http_response_code(400);
            echo json_encode(["error" => "Address required"]);
            exit;
        }

        $user_id = $_SESSION['user_id'];
        $address = htmlspecialchars(strip_tags($data['address']));

        // Fetch cart items
        $cartStmt = $pdo->prepare("SELECT c.product_id, c.quantity, p.price FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?");
        $cartStmt->execute([$user_id]);
        $cartItems = $cartStmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($cartItems)) {
            http_response_code(400);
            echo json_encode(["error" => "Cart is empty"]);
            exit;
        }

        $total = 0;
        foreach ($cartItems as $item) {
            $total += $item['price'] * $item['quantity'];
        }

        // Insert order
        $pdo->beginTransaction();
        try {
            $orderStmt = $pdo->prepare("INSERT INTO orders (user_id, total, address) VALUES (?, ?, ?)");
            $orderStmt->execute([$user_id, $total, $address]);
            $order_id = $pdo->lastInsertId();

            // Insert order items
            $itemStmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
            foreach ($cartItems as $item) {
                $itemStmt->execute([$order_id, $item['product_id'], $item['quantity'], $item['price']]);
            }

            // Clear cart
            $pdo->prepare("DELETE FROM cart WHERE user_id = ?")->execute([$user_id]);

            $pdo->commit();
            echo json_encode(["success" => true, "order_id" => $order_id]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["error" => "Order placement failed", "details" => $e->getMessage()]);
        }
        break;

    case 'GET':
        // View order history for the logged-in user
        $user_id = $_SESSION['user_id'];
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$user_id]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($orders);
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}
?>
