let byteArrayFileInput = document.getElementById('byteArrayFileInput');
    let imagePreviews = document.getElementById('imagePreviews');
    let byteArrayOutputs = document.getElementById('byteArrayOutputs');

let readFileToImage = (event) => {
    imagePreviews.innerHTML += `
        <img src="${event.target.result}" />
    `;
}

let outputByteArray = () => {
    let files = byteArrayFileInput.files;
    let fileReaderToImage = new FileReader();

    for (let f in files) {
        let file = files[f];

        fileReaderToImage.addEventListener('load', readFileToImage);
    
        file.arrayBuffer().then((arrayBuffer) => {
            var enc = new TextDecoder("utf-8");
            byteArrayOutputs.innerHTML += `
                <div>${enc.decode(arrayBuffer)}</div>
            `
        });
        fileReaderToImage.readAsDataURL(file);
    }
}