import { Modal, Button, Input } from "antd";
import React, { useState } from "react";

export default function FeedbackModal({ linkBtn, student }) {
  const [visible, setVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  const showModal = () => {
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handleSubmit = () => {
    // Here you would handle the submission of the feedback
    console.log(feedbackText); // Example: Logging the feedback text
    setVisible(false);
  };

  return (
    <div>
      <button id={linkBtn ? "link-btn" : null} onClick={showModal}>
        Add
      </button>
      <Modal
        title="Feedback"
        visible={visible}
        onCancel={handleCancel}
        footer={[
          <Button key="submit" type="primary" onClick={handleSubmit}>
            Submit
          </Button>,
        ]}
      >
        <div id="feedback-modal-content">
          <h3>Provide your feedback for {student.name}</h3>
          <Input.TextArea 
            rows={4} 
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Enter feedback here"
          />
        </div>
      </Modal>
    </div>
  );
}