import fs from "fs";
import fetch from "node-fetch";
const sourceUrl =
  "https://gist.githubusercontent.com/hieunguyenzzz/1df1aed7c62794f98b274f3a17c46c8a/raw/524e8d8cf81a9f2954a91f5ca386160c07d78415/images.md";
var download = async function (url, dest, cb) {
  var file = fs.createWriteStream(dest);
  let response = await fetch(url).catch(function (err) {
    fs.unlink(dest, () => {
      cb();
    });
  });
  if (response?.status === 200) {
    response.body.pipe(file);
    file.on("finish", function () {
      file.close(cb); // close() is async, call cb after close completes.
    });
  } else {
    // Consume response data to free up memory
    console.error(
      `Request Failed With a Status Code: ${response?.status} ,${url}`
    );
    cb();
  }
};
(async () => {
  try {
    let list = await fetch(sourceUrl).then((res) =>
      res.text().then((text) => text.split("\n"))
    );
    const { arr } = list.reduce(
      (result, item) => {
        let trimmeditem = item.trim();
        if (trimmeditem.includes("###")) {
          result.parent = trimmeditem.replace("###", "");
          result.last = {
            parent: result.parent,
            items: [],
          };
          result.arr.push(result.last);
        } else {
          result.last.items.push(trimmeditem);
        }
        return result;
      },
      {
        arr: [],
        parent: "",
        last: null,
      }
    );

    console.log({ arr }, arr[4]);
    let end = false;
    let index = 0;
    while (!end) {
      let item = arr[index];
      let parent = item.parent;
      try {
        const arr = item.items;
        console.log(JSON.stringify({ index, parent, size: list.length }));
        await new Promise((resolve, reject) => {
          arr.forEach(async (item, i, list) => {
            const url = item;

            if (!url.includes("###")) {
              var filename = url.substring(url.lastIndexOf("/") + 1);
              var dir = "./images/" + parent;
              const dest = dir + "/" + filename;
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              download(url, dest, () => {
                if (i === list.length - 1) {
                  resolve();
                }
              });
            }
          });
        });
      } catch (error) {
        console.error(error);
      }
      index++;
      if (index === arr.length) {
        end = true;
      }
    }
  } catch (error) {
    console.error(error);
  }
})();
