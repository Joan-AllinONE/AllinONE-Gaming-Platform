export default function TestPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '32px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{
        fontSize: '48px',
        fontWeight: 'bold',
        marginBottom: '16px'
      }}>测试页面</h1>
      <p style={{
        fontSize: '18px',
        marginBottom: '32px'
      }}>如果你能看到这个页面，说明React正常工作</p>
      <div style={{
        marginTop: '32px'
      }}>
        <div style={{
          backgroundColor: 'white',
          color: 'black',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <p>这是一个白色背景的区块</p>
        </div>
        <div style={{
          backgroundColor: '#ef4444',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <p>这是一个红色背景的区块</p>
        </div>
        <button style={{
          backgroundColor: '#22c55e',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer'
        }}>
          测试按钮
        </button>
      </div>
    </div>
  );
}