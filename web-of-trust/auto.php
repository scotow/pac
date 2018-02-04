<?php

if(empty($_GET['user'])) {
    http_response_code(400);
    exit;
}

if(!preg_match('/^\w+$/', $_GET['user'])) {
    http_response_code(403);
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

header("Content-Type: text/plain");
if($httpcode === 200) {
    echo shell_exec("echo -n '$public_key' | openssl dgst -sha256 -sign id_rsa | base64");
} else {
    http_response_code(403);
    echo $data;
}

?>
