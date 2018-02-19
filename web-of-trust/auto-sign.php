<?php

header('Content-Type: text/plain');

if(empty($_GET['user'])) {
    http_response_code(400);
    echo 'Please use the \'user\' GET parameter';
    exit;
}

if($_GET['user'] === 'dannyjones') {
    http_response_code(403);
    echo 'Don\'t want to share? Go fuck yourself.';
    exit;
}

if(!preg_match('/^\w+$/', $_GET['user'])) {
    http_response_code(403);
    echo 'Invalid user name';
    exit;
}

// Sesion request.
$curl = curl_init();

curl_setopt($curl, CURLOPT_URL, 'http://pac.fil.cool/uglix/bin/login');
curl_setopt($curl, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode(array("user" => "guest", "password" => "guest")));
curl_setopt($curl, CURLOPT_HEADER, true);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

$data = curl_exec($curl);
$httpcode = curl_getinfo($curl, CURLINFO_HTTP_CODE);

if($httpcode !== 200) {
    http_response_code(503);
    echo 'The session cannot be opened';
    exit;
}

curl_close($curl);

preg_match_all('/Set-Cookie: (.*);/', $data, $matches);
$cookies = implode('; ', $matches[1]);

// Public key request.
$curl = curl_init();

curl_setopt($curl, CURLOPT_URL, 'http://pac.fil.cool/uglix/bin/key-management/' . $_GET['user'] . '/pk');
curl_setopt($curl, CURLOPT_COOKIE, $cookies);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

$public_key = curl_exec($curl);
$httpcode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

if($httpcode === 200) {
    $signatures = array();
    foreach(array_reverse(glob('id_rsa_*')) as $private_key_file) {
        $signature = "Signer:\n";
        $signature .= str_replace('id_rsa_', '', $private_key_file) . "\n\n";
        $signature .= "Signature:\n";
        $signature .= shell_exec("echo -n '$public_key' | openssl dgst -sha256 -sign $private_key_file | base64");
        $signatures[] = $signature;
    }

    echo implode("\n" . str_repeat("-", 76) . "\n\n", $signatures);
} else {
    http_response_code(403);
    echo "An error has occured while fetchting the public key:\n'$public_key'";
}

?>
