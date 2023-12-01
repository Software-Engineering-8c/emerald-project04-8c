import { Modal, Button, Typography, Menu} from 'antd';
import React, { useState } from 'react';

export default function FeedbackModal(props) {
  const [visible, setVisible] = useState(false);
  const { title } = props;
  const { Text } = Typography;

  const showModal = () => {
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handleOk = () => {
    setVisible(false);
  };

  return (
    <div id='feedback-modal'>
        <Menu.Item id='show-feedback-icon' onClick={showModal}>
          <i class='fas fa-comments'/>
          &nbsp;View Feedback
        </Menu.Item>

      <Modal
        title={title}
        visible={visible}
        onCancel={handleCancel}
        width='50vw'
        footer={[
          <Button key='ok' type='primary' onClick={handleOk}>
            OK
          </Button>,
        ]}
      >
        <div style={{ textAlign: 'center', color: 'lightgray' }}>
          <Text>No Feedback Received</Text>
        </div>
      </Modal>
    </div>
  );
}
