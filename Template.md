// JQuery Form Data
var form = new FormData();
form.append("message", "oke");
form.append("number", "081234567890");
form.append("file_dikirim", fileInput.files[0], "/path/to/file");

var settings = {
  "url": "https://api.zedlabs.id/send-message",
  "method": "POST",
  "timeout": 0,
  "processData": false,
  "mimeType": "multipart/form-data",
  "contentType": false,
  "data": form
};

$.ajax(settings).done(function (response) {
  console.log(response);
});

// untuk kirim pesan ke group  URL mengarah ke https://api.zedlabs.id/send-group-message

// PHP Curl
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://api.zedlabs.id/send-message',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'POST',
  CURLOPT_POSTFIELDS => array('message' => 'oke','number' => '081234567890','file_dikirim'=> new CURLFILE('/path/to/file')),
));

$response = curl_exec($curl);

curl_close($curl);
echo $response;

// untuk kirim pesan ke group  URL mengarah ke https://api.zedlabs.id/send-group-message

// javascript XHR
// WARNING: For POST requests, body is set to null by browsers.
var data = new FormData();
data.append("message", "oke");
data.append("number", "081234567890");
data.append("file_dikirim", fileInput.files[0], "/path/to/file");
 
var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function() {
  if(this.readyState === 4) {
    console.log(this.responseText);
  }
});

xhr.open("POST", "http://localhost:8000/send-message");

xhr.send(data);

// untuk kirim pesan ke group  URL mengarah ke https://api.zedlabs.id/send-group-message
