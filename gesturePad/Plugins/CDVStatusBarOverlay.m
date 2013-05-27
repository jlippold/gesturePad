//
//  Created by https://github.com/treason/
//

#import "CDVStatusBarOverlay.h"
#import "MTStatusBarOverlay.h"

@implementation CDVStatusBarOverlay;


-(CDVPlugin*) initWithWebView:(UIWebView*)theWebView
{
    self = (CDVStatusBarOverlay*)[super initWithWebView:theWebView];
    if (self)
	{
        //NSLog(@"StatusBar Initialized!");
    }
    
    return self;
}

- (void)dealloc
{
    [super dealloc];
}



#pragma mark - JS interface methods

- (void)setStatusBar:(NSArray*)arguments withDict:(NSDictionary*)options
{
    
    MTStatusBarOverlay *overlay = [MTStatusBarOverlay sharedInstance];
    
    NSString *message = @"";
    message = [options objectForKey:@"message"];
    
    NSString *animation = @"";
    animation = [options objectForKey:@"animation"];
    
    if ([animation isEqualToString:@"FallDown"]) {
        overlay.animation = MTStatusBarOverlayAnimationFallDown;
    } else if ([animation isEqualToString:@"None"]) {
        overlay.animation = MTStatusBarOverlayAnimationNone;
    } else if ([animation isEqualToString:@"Shrink"]) {
        overlay.animation = MTStatusBarOverlayAnimationShrink;
    } else {
        overlay.animation = MTStatusBarOverlayAnimationFallDown;
    }
    
    overlay.detailViewMode = MTDetailViewModeHistory;
    
    BOOL showSpinner = NO;
    showSpinner = [[options objectForKey:@"showSpinner"] boolValue];
    overlay.hidesActivity = showSpinner;
    
    
    overlay.delegate = nil;
    overlay.progress = 0.2;
    [overlay postMessage:message];
    
}

- (void)clearStatusBar:(NSArray*)arguments withDict:(NSDictionary*)options
{
    MTStatusBarOverlay *overlay = [MTStatusBarOverlay sharedInstance];
    [overlay hide];
}

@end
