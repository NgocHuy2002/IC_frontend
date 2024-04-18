import React from "react";
import { InboxOutlined } from "@ant-design/icons";
import { message, Upload } from "antd";
import { API } from "../../constants/API";
import request from "../../service/request";

const { Dragger } = Upload;
const props = {
  name: "file",
  multiple: false,
  // action: "http://localhost:3000/api/file/upload",
  action: API.API_HOST + API.FILE,
  onChange(info) {
    const { status } = info.file;
    if (status !== "uploading") {
      console.log(info.file, info.fileList);
    }
    if (status === "done") {
      message.success(`${info.file.name} file đã được upload thành công.`);
    }
  },
  onDrop(e) {
    console.log("Dropped files", e.dataTransfer.files);
  },
};
const UploadScreen = () => {
  // const [defaultFileList, setDefaultFileList] = useState([]);
  // const [progress, setProgress] = useState(0);

  const handleUpload = async (options) => {
    const { file, onSuccess, onError, onProgress } = options;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const config = {
        headers: {
          "content-type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          // Calculate percentage of file upload progress
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          // Call onProgress callback to update progress
          onProgress({ percent: percentCompleted });
        },
      };

      // Make a POST request to the server with the file
      const response = await request.post(API.FILE, formData, config);

      // If the request is successful, call onSuccess callback
      onSuccess(response.data, file);
    } catch (error) {
      // If there's an error, call onError callback
      onError(error);
    }
  };

  return (
    <Dragger
      {...props}
      accept=".zip, .rar"
      customRequest={handleUpload}
      multiple={false}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">Bấm hoặc kéo file vào để upload file</p>
      <p className="ant-upload-hint">Chỉ nhận file định dạng .zip hoặc .rar</p>
    </Dragger>
  );
};
export default UploadScreen;
