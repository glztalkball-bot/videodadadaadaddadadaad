
import React, { useState, useEffect } from 'react';

const Header: React.FC = () => {
  const [installAvailable, setInstallAvailable] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const checkInstall = () => {
      if ((window as any).deferredPrompt) {
        setInstallAvailable(true);
      }
    };

    window.addEventListener('pwa-install-available', checkInstall);
    window.addEventListener('pwa-installed', () => setInstallAvailable(false));
    
    checkInstall();

    return () => {
      window.removeEventListener('pwa-install-available', checkInstall);
    };
  }, []);

  const handleInstall = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      (window as any).deferredPrompt = null;
      setInstallAvailable(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Magic Stitcher Pro - 专业视频拼接工具',
          text: '我正在使用这个本地视频拼接工具，支持离线安装，非常好用！',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('工具链接已复制！您可以直接粘贴发送给好友。');
    }
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
              <i className="fa-solid fa-wand-sparkles text-xl"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 leading-none tracking-tight">Magic Stitcher Pro</h1>
                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded uppercase">v1.4.0</span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">本地处理 · 离线安装 · 画质无损</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all active:scale-95"
            >
              <i className="fa-solid fa-share-nodes"></i>
              <span className="hidden sm:inline">分享工具</span>
            </button>

            {installAvailable ? (
              <button 
                onClick={handleInstall}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 animate-pulse"
              >
                <i className="fa-solid fa-download"></i>
                安装到桌面
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl">
                <i className="fa-solid fa-check-circle"></i>
                已离线就绪
              </div>
            )}
            
            <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>
            
            <button 
              onClick={() => setShowHelp(true)}
              className="w-10 h-10 rounded-xl hover:bg-indigo-50 text-indigo-500 transition-colors flex items-center justify-center"
            >
              <i className="fa-solid fa-circle-info text-xl"></i>
            </button>
          </div>
        </div>
      </header>

      {/* 帮助与安装弹窗 */}
      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <i className="fa-solid fa-mobile-screen-button text-2xl"></i>
                </div>
                <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-600">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2">如何作为本地软件使用？</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                本工具采用 PWA 技术，无需下载庞大的安装包，即可像常规软件一样“安装”在您的电脑或手机上。
              </p>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">方案 A：在线安装 (推荐)</h4>
                  <div className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold">1</div>
                    <p className="text-xs text-slate-700 leading-normal">
                      将本网页部署到服务器（或使用现有链接），发给好友。好友点击顶部的 <span className="font-bold text-indigo-600">“安装到桌面”</span> 即可。
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">方案 B：离线分发</h4>
                  <div className="flex gap-4 items-start mb-3">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold">1</div>
                    <p className="text-xs text-slate-700 leading-normal">
                      将项目源码下载并打包成 Zip 发给好友。
                    </p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold">2</div>
                    <p className="text-xs text-slate-700 leading-normal">
                      对方解压后，使用本地服务器环境（如 Live Server）运行。由于浏览器安全限制，<span className="text-red-500">直接双击 HTML 文件将无法处理视频</span>。
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-emerald-50 rounded-2xl flex gap-3 items-center">
                <i className="fa-solid fa-shield-heart text-emerald-500 text-lg"></i>
                <p className="text-[11px] text-emerald-800 font-medium">
                  提示：无论哪种方式，所有视频处理都在您的设备上完成，视频不会被上传，100% 隐私安全。
                </p>
              </div>

              <button 
                onClick={() => setShowHelp(false)}
                className="w-full mt-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
              >
                理解并返回
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
