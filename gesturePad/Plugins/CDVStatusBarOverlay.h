//
//  Created by https://github.com/treason/
//

#import <Cordova/CDVPlugin.h>
#import <UIKit/UIKit.h>

@interface CDVStatusBarOverlay: CDVPlugin <UITableViewDelegate,UITableViewDataSource>{

}

- (void)setStatusBar:(NSArray*)arguments withDict:(NSDictionary*)options;

@end
