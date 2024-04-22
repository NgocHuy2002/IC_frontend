import React, { useEffect, useRef, useState } from "react";
import {
  App,
  Button,
  Col,
  Form,
  Image,
  Input,
  List,
  Row,
  Skeleton,
  Space,
  Tour,
} from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { CloudSyncOutlined, CloudDownloadOutlined } from "@ant-design/icons";
// import axios from "axios";
import { API } from "../../constants/API";
import { formatString } from "../../constants/formatString";
import { useLocation, useParams } from "react-router-dom";
import request from "../../service/request";

const formItemLayout = {
  labelCol: {
    xs: {
      span: 24,
    },
    sm: {
      span: 4,
    },
  },
  wrapperCol: {
    xs: {
      span: 24,
    },
    sm: {
      span: 20,
    },
  },
};
const formItemLayoutWithOutLabel = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 20,
      offset: 4,
    },
  },
};

const ListImage = () => {
  const { TextArea } = Input;
  let { folderName } = useParams();
  let location = useLocation();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(false);
  const [data, setData] = useState([]);
  const prevRef = useRef();
  const nextRef = useRef();
  const submitRef = useRef();
  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref3 = useRef(null);
  const formRef = useRef(null);
  const [imgName, setImgName] = useState(null);
  const [describe, setDescribe] = useState(["", "", "", "", ""]);
  const [hasMore, setHasMore] = useState(true);
  const [select, setSelect] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [open, setOpen] = useState(false);

  const steps = [
    {
      title: "Chọn ảnh",
      description: "Chọn ảnh để bắt đầu thêm mô tả.",
      target: () => ref1.current,
    },
    {
      title: "Nhập mô tả",
      description:
        "Chọn 1 trường mô tả để bắt đầu nhập ( Tab để chuyển nhanh sang trường tiếp theo ).",
      target: () => ref2?.current,
    },
    {
      title: "Lưu mô tả",
      description: "Lưu mô tả của ảnh .",
      target: () => submitRef?.current,
    },
    {
      title: "Chuyển ảnh",
      description: "Chuyển sang ảnh tiếp theo.",
      target: () => nextRef?.current,
    },
    {
      title: "Xuất & tải file",
      description:
        "Xuất toàn bộ mô tả của tất cả các ảnh trong thư mục thành file JSON và tải xuống ( Ctrl + S ).",
      target: () => ref3?.current,
    },
  ];
  // --------------- useEffect ------------------
  useEffect(() => {
    const resetState = () => {
      setData([]);
      setPage(1);
      setImgName(null);
      setSelect(0);
      setStatus(false);
      setHasMore(true);
      form.setFieldsValue({
        describes: ["", "", "", "", ""],
      });
    };

    resetState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderName]);

  useEffect(() => {
    loadMoreData(1);
    if (!localStorage.getItem("previouslyVisited")) {
      openTour();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderName]);
  // --------------------------------------------
  // --------------- Action ---------------------
  const onFinish = (values) => {
    console.log("Received values of form:", values);
    const formData = new FormData();
    formData.append("name", imgName);
    formData.append("folder", folderName);
    formData.append(
      "describe",
      JSON.stringify(Object.values(values.describes))
    );
    request
      .post(API.ADD_DESCRIBE, formData)
      .then((res) => {
        if (res.status === 200) {
          message.success(res?.data?.message);
        }
      })
      .catch((err) => console.log(err));
  };

  const openTour = () => {
    // console.log(localStorage.getItem("previouslyVisited"));
    setOpen(true);
    localStorage.setItem("previouslyVisited", true);
  };

  async function loadMoreData(newPage) {
    // if (!hasMore) {
    //   return;
    // }
    setHasMore(true);
    await request
      .get(
        formatString(API.GET_ALL_IMAGE_NAME, location.state.key, newPage, limit)
      )
      .then((res) => {
        if (res.data) {
          const newData = res.data.files;
          setData((prevData) => [...prevData, ...newData]);
          setPage(newPage);
          // setPage(pageNumber);
          // Check if there are more pages
          if (newData.length < limit) {
            setHasMore(false);
          }
        }
      });
    // .catch(() => {
    //   setHasMore(false);
    // })
    // .finally(() => {
    //   setHasMore(false);
    // });
  }
  const handleGetDescribe = async (name, index) => {
    // request.get(formatString(API.GET_DESCRIBE, name))
    setSelect(index);
    setImgName(name);
    requestDescribe(name);
  };

  const requestDescribe = (name) => {
    request
      .get(formatString(API.GET_DESCRIBE, name))
      .then((res) => {
        if (res?.data) {
          setDescribe(res.data.describe.describe);
          const data = res.data.describe.describe;
          const array = [];
          data.map((item) => {
            return array.push(item);
          });
          form.setFieldsValue({
            describes: array,
          });
        }
      })
      .catch((err) => {
        if (err?.response?.status === 500) {
          form.setFieldsValue({
            describes: ["", "", "", "", ""],
          });
        }
      });
  };

  const exportFile = async () => {
    setLoading(true);
    const form = new FormData();
    form.append("folderName", folderName);
    await request
      .post(API.EXPORT_FILE, form)
      .then((res) => {
        if (res.data) {
          message.success(res.data.message);
          // window.open(res.data.file);
          setStatus(true);
          setLoading(false);
        }
      })
      .catch((err) => {
        setLoading(false);
        setStatus(false);
      });
  };

  const downloadFile = async () => {
    await request
      .get(formatString(API.DOWNLOAD, folderName), { responseType: "blob" })
      .then((res) => {
        if (res.data) {
          const blob = new Blob([res.data], { type: "application/json" });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${folderName}.json`;
          link.click();
          setStatus(false);
        }
      })
      .catch((err) => {
        setLoading(false);
        setStatus(false);
      });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Tab" && event.target === submitRef.current) {
      event.preventDefault();
      nextRef.current.focus();
    }
    if (event.key === "Tab" && event.target === nextRef.current) {
      event.preventDefault();
      form.getFieldInstance(["describes", 0]).focus();
    }
    if (event.ctrlKey && event.key === "s") {
      event.preventDefault();
      // console.log("Ctrl + S");
      if (status) {
        downloadFile();
      } else {
        exportFile();
      }
    }
  };

  const moveToPrevImg = () => {
    setSelect(select - 1);
    setImgName(data[select - 2]);
    requestDescribe(data[select - 2]);
    // console.log("select >>>", select - 1);
    console.log("name >>>", data[select]);
  };

  const moveToNextImg = () => {
    setSelect(select + 1);
    setImgName(data[select]);
    requestDescribe(data[select]);
  };
  // --------------------------------------------
  return (
    <div onKeyDown={handleKeyDown}>
      <Row style={{ maxHeight: 500, minHeight: 200 }} gutter={2}>
        <Col span={4}>
          <div
            id="scrollableDiv"
            style={{ height: 500, overflow: "auto" }}
            ref={ref1}
          >
            <InfiniteScroll
              // style={{
              //   width: "100%",
              //   height: 500,
              // }}
              dataLength={data.length}
              next={() => loadMoreData(page + 1)}
              hasMore={hasMore}
              loader={<Skeleton.Image active />}
              scrollableTarget="scrollableDiv"
            >
              <List
                dataSource={data}
                grid={{
                  gutter: 6,
                  column: 1,
                }}
                renderItem={(item, index) => (
                  <List.Item
                    key={index + 1}
                    style={{
                      borderWidth: select === index + 1 ? 2 : 0,
                      borderStyle: "solid",
                      borderColor: "red",
                    }}
                  >
                    <Image
                      onClick={() => handleGetDescribe(item, index + 1)}
                      width={"100%"}
                      preview={true}
                      src={formatString(
                        API.API_HOST + API.VIEW_IMAGE,
                        folderName,
                        item
                      )}
                    />
                  </List.Item>
                )}
              />
            </InfiniteScroll>
          </div>
        </Col>
        <Col
          span={18}
          style={{
            width: "80%",
            maxHeight: "100%",
          }}
        >
          <Form
            form={form}
            ref={formRef}
            name="dynamic_form_item"
            {...formItemLayoutWithOutLabel}
            onFinish={onFinish}
            style={{
              maxWidth: "100%",
              maxHeight: 500,
              minHeight: 200,
              overflow: "auto",
            }}
          >
            <Form.List
              name="describes"
              rules={[
                {
                  validator: async (_, names) => {
                    if (!names || names.length < 5) {
                      return Promise.reject(new Error("At least 5 passengers"));
                    }
                  },
                },
              ]}
              initialValue={describe}
            >
              {(fields, { add, remove }, { errors }) => (
                <div ref={ref2}>
                  {fields.map((field, index) => (
                    <Form.Item
                      {...field}
                      {...(index === 0
                        ? formItemLayout
                        : formItemLayoutWithOutLabel)}
                      label={index === 0 ? `Mô tả` : ""}
                      required={false}
                      // key={[field.key, "item"]}
                      // name={[field.name, "item"]}
                      tabIndex={index + 1}
                    >
                      <TextArea
                        rows={2}
                        placeholder="Mô tả"
                        // onChange={(value) => console.log(value.currentTarget)}
                        style={{
                          width: "80%",
                        }}
                      />
                      {/* </Form.Item> */}
                      {/* {fields.length > 1 ? (
                      <MinusCircleOutlined
                        className="dynamic-delete-button"
                        onClick={() => remove(field.name)}
                        style={{
                          paddingLeft: 20,
                          position: "absolute",
                          top: "40%",
                          bottom: "40%",
                        }}
                      />
                    ) : null} */}
                    </Form.Item>
                  ))}
                  {/* <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    style={{
                      width: "60%",
                    }}
                    icon={<PlusOutlined />}
                  >
                    Thêm mô tả
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item> */}
                </div>
              )}
            </Form.List>
            <Form.Item>
              <Row>
                <Space>
                  <Button type="primary" htmlType="submit" ref={submitRef}>
                    Lưu mô tả
                  </Button>
                  {select > 1 ? (
                    <Button
                      type="primary"
                      ref={prevRef}
                      onClick={() => moveToPrevImg()}
                    >
                      Prev
                    </Button>
                  ) : null}
                  <Button
                    type="primary"
                    ref={nextRef}
                    onClick={() => moveToNextImg()}
                  >
                    Next
                  </Button>
                </Space>
              </Row>
            </Form.Item>
          </Form>
        </Col>
        <Col span={2}>
          <Button
            type="primary"
            shape="round"
            size="small"
            ref={ref3}
            icon={status ? <CloudDownloadOutlined /> : <CloudSyncOutlined />}
            loading={loading}
            onClick={() => {
              status ? downloadFile() : exportFile();
            }}
          >
            {status ? "Tải file" : "Xuất file"}
          </Button>
        </Col>
      </Row>
      <Tour open={open} onClose={() => setOpen(false)} steps={steps} />
    </div>
  );
};
export default ListImage;
