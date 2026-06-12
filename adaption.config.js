/**
 * 屏幕适配配置说明
 * 
 * 本项目采用基于设计稿尺寸的自适应方案
 */

module.exports = {
  // ==================
  // 设计稿尺寸配置
  // ==================
  // 这些值应该与 variables.scss 中的值保持一致
  
  UI_WIDTH: 1136,      // 设计稿宽度 (px)
  UI_HEIGHT: 640,      // 设计稿高度 (px)
  
  // ==================
  // 宽高比配置
  // ==================
  ASPECT_RATIO: '1136 / 640',  // 设计稿宽高比

  // ==================
  // 屏幕适配类型
  // ==================
  ADAPTION_TYPES: {
    /**
     * cspx: 基础屏幕适配
     * 用法: @include cspx(font-size, 20px);
     * 无比例因子，直接转换像素
     */
    BASIC: 'cspx',
    
    /**
     * cispx: 带比例因子的屏幕适配
     * 用法: @include cispx(bottom, 0.65, 30px);
     * 第二个参数为比例因子（0-1.5）
     */
    SCALED: 'cispx',
    
    /**
     * customGap: 响应式间距（基础）
     * 用法: @include customGap(margin-bottom, 10px);
     */
    GAP_BASIC: 'customGap',
    
    /**
     * cisGap: 响应式间距（带比例因子）
     * 用法: @include cisGap(margin-bottom, 0.8, 10px);
     */
    GAP_SCALED: 'cisGap'
  },

  // ==================
  // 常用比例因子参考
  // ==================
  PROPORTION_PRESETS: {
    HALF: 0.5,        // 50% - 缩小一半
    SMALL: 0.65,      // 65% - 小幅缩小（常用于间距）
    MEDIUM: 0.8,      // 80% - 中等缩小
    NORMAL: 1.0,      // 100% - 保持原尺寸
    MEDIUM_EXPAND: 1.2,   // 120% - 中等放大
    LARGE_EXPAND: 1.5     // 150% - 大幅放大
  },

  // ==================
  // 常见属性适配示例
  // ==================
  COMMON_PROPERTIES: {
    SIZE: ['width', 'height'],
    PADDING: ['padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right'],
    MARGIN: ['margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right'],
    POSITION: ['top', 'bottom', 'left', 'right'],
    FONT: ['font-size', 'line-height'],
    RADIUS: ['border-radius'],
    BORDER: ['border-width', 'border']
  },

  // ==================
  // 最佳实践
  // ==================
  BEST_PRACTICES: [
    '1. 优先使用 SCSS 变量和 mixin，避免硬编码像素值',
    '2. 对于需要动态缩放的元素使用 cispx，对于固定的使用 cspx',
    '3. 字体大小通常使用 cspx（固定尺寸）',
    '4. 间距和位置可以根据需要使用 cispx（可缩放）',
    '5. 在设置根元素字体大小时使用 cspx(font-size, 10px)',
    '6. 使用 rem 作为其他元素的相对单位，这样会自动适应根元素字体大小',
    '7. 定期测试竖屏和横屏模式的显示效果'
  ]
};
