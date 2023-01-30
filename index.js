import fs from "fs";
import fetch from "node-fetch";
const sourceUrl =
  "https://gist.githubusercontent.com/hieunguyenzzz/1df1aed7c62794f98b274f3a17c46c8a/raw/524e8d8cf81a9f2954a91f5ca386160c07d78415/images.md";
var download = async function (url, dest, cb) {
  var file = fs.createWriteStream(dest);
  let response = await fetch(url).catch(function (err) {
    // Handle errors
    fs.unlink(dest, () => {
      console.log(err);
      cb();
    }); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
  if (response.status === 200) {
    response.body.pipe(file);
    file.on("finish", function () {
      file.close(cb); // close() is async, call cb after close completes.
    });
  } else {
    // Consume response data to free up memory
    cb();
    throw new Error(
      url,
      `Request Failed With a Status Code: ${response.statusCode}`
    );
  }
};
(async () => {
  let arr = await fetch(sourceUrl).then((res) =>
    res.text().then((text) => text.split("\n"))
  );
  let end = false;
  let index = 0;
  while (!end) {
    try {
      await new Promise((resolve, reject) => {
        new Array(10).fill(true).forEach(async (item, i, list) => {
          if (index === arr.length) {
            console.log(index, arr.length);
            end = true;
            return;
          }
          const url = arr[index];
          index++;
          if (!url.includes("###")) {
            var filename = url.substring(url.lastIndexOf("/") + 1);
            var dir =
              "./images" +
              url
                .replace("https://static.mobelaris.com", "")
                .replace(filename, "")
                .trim();
            const dest = dir + "/" + filename;
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            try {
              console.log("start", { url, dest });
              download(url, dest, () => {
                console.log("end", { url, dest });
              });
              if (i === list.length - 1) {
                resolve();
              }
            } catch (error) {
              console.error(error, url);
            }
          }
        });
      });
    } catch (error) {
      console.error(error);
    }
  }
})();
