using ReactNative.Bridge;
using System;
using System.Collections.Generic;
using Windows.ApplicationModel.Core;
using Windows.UI.Core;

namespace Zcoin.Sigma.RNZcoinSigma
{
    /// <summary>
    /// A module that allows JS to share data.
    /// </summary>
    class RNZcoinSigmaModule : NativeModuleBase
    {
        /// <summary>
        /// Instantiates the <see cref="RNZcoinSigmaModule"/>.
        /// </summary>
        internal RNZcoinSigmaModule()
        {

        }

        /// <summary>
        /// The name of the native module.
        /// </summary>
        public override string Name
        {
            get
            {
                return "RNZcoinSigma";
            }
        }
    }
}
