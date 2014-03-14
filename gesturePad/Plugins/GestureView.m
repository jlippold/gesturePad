#import "GestureView.h"
#import "UIImage+ImageEffects.h"
#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>

@implementation GestureView

UIColor *newGrey = nil;

-(CDVPlugin*) initWithWebView:(UIWebView*)theWebView
{
    self = (GestureView*)[super initWithWebView:theWebView];
    [[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
    [[NSNotificationCenter defaultCenter]
     addObserver:self selector:@selector(orientationChanged:)
     name:UIDeviceOrientationDidChangeNotification
     object:[UIDevice currentDevice]];
    
    return self;
}


- (void) orientationChanged:(NSNotification *)note
{
    [self resizeView];
}

- (void)resizeView {
    [self positionViews];
}

- (void)positionViews {
    
    [self.webView setBackgroundColor:[UIColor clearColor]];
    [self.webView setOpaque:NO];
    self.webView.frame = CGRectMake( 0, 114, [[UIScreen mainScreen] bounds].size.width,
                                    [[UIScreen mainScreen] bounds].size.height - 275);
    [self.webView.superview bringSubviewToFront:self.webView];
}



- (void)create:(NSArray*)arguments withDict:(NSDictionary*)options
{

    newGrey = [UIColor colorWithRed:0.678 green:0.678 blue:0.678 alpha:1.0];
    _bgURL = @"";
    isPlaying = NO;
    _lastNavTitle = @"";
    _lastNavSubTitle = @"";

    
    _gView = [[UIView alloc] initWithFrame:CGRectMake( 0, 0, [[UIScreen mainScreen] bounds].size.width,
                                                      [[UIScreen mainScreen] bounds].size.height)];
    _gView.userInteractionEnabled = YES;

    
    
    UIColor *tinted = [UIColor colorWithWhite:0.0 alpha:0.3];
    
    //nav bar
    CGRect navBarFrame = CGRectMake(0, 0, [[UIScreen mainScreen] bounds].size.width, 64.0);
    [[UINavigationBar appearance] setShadowImage:[[UIImage alloc] init]];
    _navbar = [[UINavigationBar alloc] initWithFrame:navBarFrame];
    [_navbar setBackgroundImage:[UIImage new] forBarMetrics:UIBarMetricsDefault];
    _navbar.translucent = YES;
    _navbar.tintColor = [UIColor whiteColor];
    _navbar.titleTextAttributes = @{NSForegroundColorAttributeName : [UIColor whiteColor]};

    

    _navTitle = [[UILabel alloc] init];
    _navTitle.translatesAutoresizingMaskIntoConstraints = YES;
    _navTitle.text = @"";
    _navTitle.font = [UIFont fontWithName:@"Helvetica-Bold" size:17];
    [_navTitle setTextColor:[UIColor whiteColor]];
    _navTitle.tintColor = [UIColor whiteColor];
    _navTitle.textAlignment = NSTextAlignmentCenter;
    _navTitle.frame = CGRectMake(0, 28, self.webView.superview.bounds.size.width, 20);
    
    _navSubTitle = [[UILabel alloc] init];
    _navSubTitle.translatesAutoresizingMaskIntoConstraints = YES;
    _navSubTitle.text = @"";
    _navSubTitle.font = [UIFont fontWithName:@"Helvetica" size:15];
    [_navSubTitle setTextColor: newGrey];
    _navSubTitle.textAlignment = NSTextAlignmentCenter;
    _navSubTitle.frame = CGRectMake(0, 44, self.webView.superview.bounds.size.width, 20);
    [_navSubTitle setFont:[UIFont systemFontOfSize:14]];
    
    [_navbar addSubview:_navTitle];
    [_navbar addSubview:_navSubTitle];
    
    UINavigationItem *navItem = [UINavigationItem alloc];
    UIBarButtonItem *leftButton = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemAction target:self  action:@selector(leftNavButtonTap:)];
    navItem.leftBarButtonItem = leftButton;
    
    UIBarButtonItem *rightButton = [[UIBarButtonItem alloc] initWithImage:[UIImage imageNamed:@"www/img/ui/ListIcon@2x.png"] style:UIBarButtonItemStylePlain target:self  action:@selector(rightNavButtonTap:)];
    navItem.rightBarButtonItem = rightButton;
    [_navbar pushNavigationItem:navItem animated:false];
    
    //bottom view
    _bottomView = [[UIView alloc] init];
    _bottomView.frame = CGRectMake(0, self.webView.superview.bounds.size.height - 200, self.webView.superview.bounds.size.width, 200);
    
    [[UISlider appearance]
     setThumbImage:[UIImage imageNamed:@"www/img/ui/SystemMediaControl-ScrubberTrack@2x.png"]
     forState:UIControlStateNormal];
    
    UIView *nowPlayingContainer = [[UIView alloc] init];
    //nowPlayingContainer.frame = CGRectMake(0, 30, 300, 20);
    nowPlayingContainer.frame = CGRectMake(0, 64, self.webView.superview.bounds.size.width, 33);

    _durationStart = [[UILabel alloc] init];
    _durationStart.text = @"";
    [_durationStart setTextColor:newGrey];
    _durationStart.textAlignment = NSTextAlignmentRight;
    _durationStart.frame = CGRectMake(5, 1, 40, 30);
    [_durationStart setFont:[UIFont systemFontOfSize:12]];
    
    _nowPlayingSlider = [[UISlider alloc] init];
    _nowPlayingSlider.frame = CGRectMake(50, 0, [[UIScreen mainScreen] bounds].size.width - 100, 34);
    _nowPlayingSlider.minimumValue = 0.0;
    _nowPlayingSlider.maximumValue = 100.0;
    [_nowPlayingSlider setMaximumTrackTintColor:newGrey];
    [_nowPlayingSlider addTarget:self
                      action:@selector(seekChanged:)
            forControlEvents:UIControlEventTouchUpInside];
    
    _durationEnd = [[UILabel alloc] init];
    _durationEnd.translatesAutoresizingMaskIntoConstraints = NO;
    [_durationEnd setTextColor:newGrey];
    _durationEnd.text = @"";
    _durationEnd.textAlignment = NSTextAlignmentLeft;
    _durationEnd.frame = CGRectMake([[UIScreen mainScreen] bounds].size.width - 48, 1, 40, 30);
    [_durationEnd setFont:[UIFont systemFontOfSize:12]];
    
    [nowPlayingContainer addSubview:_durationStart];
    [nowPlayingContainer addSubview:_nowPlayingSlider];
    [nowPlayingContainer addSubview:_durationEnd];
    
    
    UIView *topBG = [[UIView alloc] initWithFrame:CGRectMake(0, 0, [[UIScreen mainScreen] bounds].size.width, 100.0)];
    topBG.backgroundColor = tinted;
    
    _title = [[UILabel alloc] init];
    _title.translatesAutoresizingMaskIntoConstraints = YES;
    _title.text = @"";
    _title.font = [UIFont fontWithName:@"Helvetica-Bold" size:17];
    [_title setTextColor:[UIColor whiteColor]];
    _title.tintColor = [UIColor whiteColor];
    _title.textAlignment = NSTextAlignmentCenter;
    _title.frame = CGRectMake(0, 58, self.webView.superview.bounds.size.width, 20);
    
    _subTitle = [[UILabel alloc] init];
    _subTitle.translatesAutoresizingMaskIntoConstraints = YES;
    _subTitle.text = @"";
    _subTitle.font = [UIFont fontWithName:@"Helvetica" size:15];
    [_subTitle setTextColor: newGrey];
    _subTitle.textAlignment = NSTextAlignmentCenter;
    _subTitle.frame = CGRectMake(0, 76, self.webView.superview.bounds.size.width, 20);
    [_subTitle setFont:[UIFont systemFontOfSize:14]];
    
    [_bottomView addSubview:_title];
    [_bottomView addSubview:_subTitle];
    
    
    //play buttons
    _toolbar = [[UIToolbar alloc] init];
    _toolbar.clipsToBounds = YES;
    _toolbar.tintColor = [UIColor whiteColor];
    _toolbar.frame = CGRectMake(0, 104, self.webView.superview.bounds.size.width, 30);
   [_toolbar setBackgroundImage:[UIImage new] forToolbarPosition:UIToolbarPositionAny barMetrics:UIBarMetricsDefault];
    

    
    UIBarButtonItem *flex = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFlexibleSpace target:self action:nil ];
    UIBarButtonItem *fit = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFixedSpace target:self action:nil ];
    fit.width = 15.0f;
    
    UIBarButtonItem *rewindButton = [[UIBarButtonItem alloc] initWithImage:[UIImage imageNamed:@"www/img/ui/SystemMediaControl-Rewind@2x.png"] style:UIBarButtonItemStyleBordered target:self action:@selector(rewind:) ];
    rewindButton.imageInsets = UIEdgeInsetsMake(3, 3, 3, 3);
    
    _playButton = [[UIBarButtonItem alloc] initWithImage:[UIImage imageNamed:@"www/img/ui/SystemMediaControl-Play@2x.png"] style:UIBarButtonItemStyleBordered target:self action:@selector(playButtonTap:) ];

    UIBarButtonItem *forwardButton = [[UIBarButtonItem alloc] initWithImage:[UIImage imageNamed:@"www/img/ui/SystemMediaControl-Forward@2x.png"] style:UIBarButtonItemStyleBordered target:self action:@selector(forward:) ];
    rewindButton.imageInsets = UIEdgeInsetsMake(4, 3, 4, 3);
    
    NSArray *buttons = [NSArray arrayWithObjects: flex, rewindButton, flex, _playButton, flex, forwardButton, flex, nil];
    [_toolbar setItems: buttons animated:NO];
    [_bottomView addSubview:_toolbar];
    

	
    UIView *volumeContainer = [[UIView alloc] init];
    volumeContainer.frame = CGRectMake(0, 134, self.webView.superview.bounds.size.width, 36);
    
    UIImageView *volDown = [[UIImageView alloc] init];
    volDown.image =[UIImage imageNamed:@"www/img/ui/volume-minimum@2x.png"];
    volDown.frame = CGRectMake(10, 6, 20, 22);
    volDown.image = [volDown.image imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
    [volDown setTintColor:[UIColor whiteColor]];
    volDown.userInteractionEnabled = YES;
    [volDown addGestureRecognizer:[[UITapGestureRecognizer alloc]initWithTarget:self action:@selector(muteButtonTap:)]];
    
    
    //seekbar
    _volumeSlider = [[UISlider alloc] init];
    _volumeSlider.frame = CGRectMake(30, 0, [[UIScreen mainScreen] bounds].size.width - 68, 34);
    _volumeSlider.minimumValue = 0.0;
    _volumeSlider.maximumValue = 100.0;
    _volumeSlider.value = 50;
    [_volumeSlider setMaximumTrackTintColor:newGrey];
    [_volumeSlider addTarget:self
                     action:@selector(volumeChanged:)
           forControlEvents:UIControlEventTouchUpInside];
    
    UIImageView *volUp = [[UIImageView alloc] init];
    volUp.image =[UIImage imageNamed:@"www/img/ui/volume-maximum@2x.png"];
    volUp.frame = CGRectMake([[UIScreen mainScreen] bounds].size.width - 30, 6, 20, 22);
    volUp.image = [volUp.image imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
    [volUp setTintColor:[UIColor whiteColor]];
    volUp.userInteractionEnabled = YES;
    [volUp addGestureRecognizer:[[UITapGestureRecognizer alloc]initWithTarget:self action:@selector(muteButtonTap:)]];
    
    [volumeContainer addSubview:volDown];
    [volumeContainer addSubview:_volumeSlider];
    [volumeContainer addSubview:volUp];

    [_bottomView addSubview:volumeContainer];
    
    //bottom buttons
    _bottomBar = [[UIToolbar alloc] init];
    _bottomBar.clipsToBounds = YES;
    _bottomBar.frame = CGRectMake(0, 170, self.webView.superview.bounds.size.width, 30);
    [_bottomBar setBackgroundImage:[UIImage new] forToolbarPosition:UIToolbarPositionAny barMetrics:UIBarMetricsDefault];

    _powerButton = [[UIBarButtonItem alloc] initWithTitle:@"Power" style:UIBarButtonItemStylePlain target:self action:@selector(powerButtonTap:)];
    [_powerButton setStyle:UIBarButtonItemStylePlain];
    [_powerButton setTintColor:[UIColor whiteColor]];
    [_powerButton setTitleTextAttributes: [NSDictionary dictionaryWithObjectsAndKeys: [UIFont fontWithName:@"Helvetica" size:14.0], NSFontAttributeName,  nil]forState:UIControlStateNormal];
    
    _configButton = [[UIBarButtonItem alloc] initWithTitle:@"Action" style:UIBarButtonItemStylePlain target:self action:@selector(configButtonTap:)];
    [_configButton setStyle:UIBarButtonItemStylePlain];
    [_configButton setTintColor:[UIColor whiteColor]];
    [_configButton setTitleTextAttributes: [NSDictionary dictionaryWithObjectsAndKeys: [UIFont fontWithName:@"Helvetica" size:14.0], NSFontAttributeName,  nil]forState:UIControlStateNormal];
    
    _roomButton = [[UIBarButtonItem alloc] initWithTitle:@"Room" style:UIBarButtonItemStylePlain target:self action:@selector(roomButtonTap:)];
    [_roomButton setStyle:UIBarButtonItemStylePlain];
    [_roomButton setTintColor:[UIColor whiteColor]];
    [_roomButton setTitleTextAttributes: [NSDictionary dictionaryWithObjectsAndKeys: [UIFont fontWithName:@"Helvetica" size:14.0], NSFontAttributeName,  nil]forState:UIControlStateNormal];
    
    _inputButton = [[UIBarButtonItem alloc] initWithTitle:@"Input" style:UIBarButtonItemStylePlain target:self action:@selector(inputButtonTap:)];
    [_inputButton setStyle:UIBarButtonItemStylePlain];
    [_inputButton setTintColor:[UIColor whiteColor]];
    [_inputButton setTitleTextAttributes: [NSDictionary dictionaryWithObjectsAndKeys: [UIFont fontWithName:@"Helvetica" size:14.0], NSFontAttributeName,  nil]forState:UIControlStateNormal];
    
    NSArray *btn = [NSArray arrayWithObjects: _roomButton, flex, _configButton, flex , _powerButton, flex, _inputButton, nil];
    [_bottomBar setItems: btn animated:NO];

    [_bottomView addSubview:_bottomBar];
    
    
    _bgView = [[UIImageView alloc] initWithImage:[UIImage new]];
    _bgView.frame = CGRectMake([[UIScreen mainScreen] bounds].size.width/2*-1,
                               [[UIScreen mainScreen] bounds].size.height/2*-1,
                               [[UIScreen mainScreen] bounds].size.width*2,
                               [[UIScreen mainScreen] bounds].size.height*2);
    
    _boxCover = [[UIImageView alloc] initWithImage:[UIImage new]];
    _boxCover.frame = CGRectMake( 0, 114, [[UIScreen mainScreen] bounds].size.width, [[UIScreen mainScreen] bounds].size.height - 275);
    
    _boxCover.tag = 99;
    _boxCover.contentMode = UIViewContentModeScaleAspectFit;
    
    _boxCover.alpha = 0.0;
    _bgView.alpha = 0.0;

    
    [_gView addSubview:_bgView ];
    [_gView addSubview:topBG ];

    
    [_gView addSubview:_navbar];
    [_gView addSubview:_boxCover];
    [_gView addSubview:nowPlayingContainer];
    
    
    [_gView addSubview:_bottomView];
    self.webView.superview.autoresizesSubviews = YES;
    [self.webView.superview addSubview:_gView];
    
    CAGradientLayer *bgLayer = [self getGradient];
    bgLayer.frame = _gView.frame;
    [_gView.layer insertSublayer:bgLayer atIndex:0];
    
    [self positionViews];
    [self setTint:newGrey];

}

- (void)setOptionsForView:(NSArray*)arguments withDict:(NSDictionary*)options
{

    if ([options objectForKey:@"navTitle"]) {
        _navTitle.text = [options objectForKey:@"navTitle"];
        _lastNavTitle = [[NSString alloc] initWithString:_navTitle.text];
    }
    if ([options objectForKey:@"navSubTitle"]) {
        _navSubTitle.text = [options objectForKey:@"navSubTitle"];
        _lastNavSubTitle = [[NSString alloc] initWithString:_navSubTitle.text];    }
    
    if ([options objectForKey:@"title"]) {
        _title.text = [options objectForKey:@"title"];
    }
    if ([options objectForKey:@"subTitle"]) {
        _subTitle.text = [options objectForKey:@"subTitle"];
    }
    
    if ([options objectForKey:@"durationStartText"]) {
        _durationStart.text = [options objectForKey:@"durationStartText"];
    }
    if ([options objectForKey:@"durationEndText"]) {
        _durationEnd.text = [options objectForKey:@"durationEndText"];
    }
    if ([options objectForKey:@"durationSliderValue"]) {
        _nowPlayingSlider.value = [[options objectForKey:@"durationSliderValue"] intValue];
    }
    
    if ([[options objectForKey:@"durationEndText"] isEqualToString:@""]
        && [[options objectForKey:@"durationStartText"] isEqualToString:@""] ) {
        //Not playing title
        _playButton.image = [UIImage imageNamed:@"www/img/ui/SystemMediaControl-Play@2x.png"];
        isPlaying = NO;
    }
    
    
    if ( ![options objectForKey:@"url"]  ) {
        return;
    }
    
    if ([[options objectForKey:@"url"] isEqualToString:_bgURL] ) {
        return;
    }
    

    if ([[options objectForKey:@"url"] isEqualToString:@""] ) {
        [self wipeBackground];
        return;
    }
    
    
    _bgURL = [[NSString alloc] initWithString:[options objectForKey:@"url"]];
    NSURL *imgUrl = [[NSURL alloc] initWithString:[options objectForKey:@"url"]];
    NSError* error = nil;
    NSData *imgData = [NSData dataWithContentsOfURL:imgUrl options:NSDataReadingUncached error:&error];
    if (error) {
        [self wipeBackground];
    } else {
        
        UIImage *img = [UIImage imageWithData:imgData];
        if (img.size.width < 1 ) {
            [self wipeBackground];
            return;
        }
        
        // Create the image context
        UIGraphicsBeginImageContext(_bgView.frame.size);
        UIImage *blurredSnapshotImage = [img applyDarkEffect];
        UIGraphicsEndImageContext();
        
        _boxCover.alpha = 0.0;
        _bgView.alpha = 0.0;
        _boxCover.image = img;
        _bgView.image = blurredSnapshotImage;
        _bgView.contentMode = UIViewContentModeScaleAspectFill;
        _bgView.frame = CGRectMake([[UIScreen mainScreen] bounds].size.width/2*-1,
                                   [[UIScreen mainScreen] bounds].size.height/2*-1,
                                   [[UIScreen mainScreen] bounds].size.width*2,
                                   [[UIScreen mainScreen] bounds].size.height*2);
        
        _boxCover.transform = CGAffineTransformMakeScale(0.01, 0.01);
        
        [UIView animateWithDuration:0.25 delay: 0.0 options: UIViewAnimationOptionCurveEaseIn  animations:^{
            _boxCover.alpha = 1.0;
            _bgView.alpha = 1.0;
           _boxCover.transform = CGAffineTransformIdentity; //100%
        } completion:^(BOOL finished){
            isPlaying = YES;
            _playButton.image = [UIImage imageNamed:@"www/img/ui/SystemMediaControl-Pause@2x.png"];
            
            UIColor *avgColor = [self averageColor:img];
            CGFloat hue, saturation, brightness, alpha ;
            BOOL ok = [ avgColor getHue:&hue saturation:&saturation brightness:&brightness alpha:&alpha ] ;
            if ( ok ) {
                avgColor = [UIColor colorWithHue:hue saturation:saturation brightness:.85f alpha:alpha ] ;
                [self setTint:avgColor];
            } else {
                [self setTint:newGrey];
            }
           
        }];
        
        
    }
    
    
}

- (void) setTint:(UIColor*) tintColor {
    _navbar.tintColor = tintColor;
    _powerButton.tintColor = tintColor;
    _inputButton.tintColor = tintColor;
    _roomButton.tintColor = tintColor;
    _configButton.tintColor = tintColor;
    
    _nowPlayingSlider.tintColor = tintColor;
    [_nowPlayingSlider setMinimumTrackTintColor:tintColor];
    
    _volumeSlider.tintColor = tintColor;
    [_volumeSlider setMinimumTrackTintColor:tintColor];
    [self.webView stringByEvaluatingJavaScriptFromString:
     [NSString stringWithFormat:@"setDrawColors('#%@');", [self colorToWeb:tintColor]]];
    
}

- (void)setStatusBar:(NSArray*)arguments withDict:(NSDictionary*)options {
    if ([options objectForKey:@"show"]) {
        if ([[options objectForKey:@"show"] boolValue]) {
            [[UIApplication sharedApplication] setStatusBarHidden:NO withAnimation:UIStatusBarAnimationNone];
        } else {
            [[UIApplication sharedApplication] setStatusBarHidden:YES withAnimation:UIStatusBarAnimationNone];
        }
    }
}


- (void) wipeBackground {
    
    if (_boxCover.alpha == 0.0) {
        _bgView.alpha = 0.0;
        _bgURL = @"";
        [self setTint:newGrey];
        return;
    }
    

    _boxCover.alpha = 1.0;
    _bgView.alpha = 1.0;
    _bgView.frame = CGRectMake(0, 0, [[UIScreen mainScreen] bounds].size.width, [[UIScreen mainScreen] bounds].size.height);
    _bgView.contentMode = UIViewContentModeScaleToFill;
    _boxCover.transform = CGAffineTransformIdentity; //100%

    [UIView animateWithDuration:0.25 delay: 0.0 options: UIViewAnimationOptionCurveEaseIn  animations:^{
        _boxCover.alpha = 0.0;
        _bgView.alpha = 0.0;
        _boxCover.transform = CGAffineTransformMakeScale(0.01, 0.01);
    } completion:^(BOOL finished){
        _bgView.image = [UIImage new];
        _boxCover.image = [UIImage new];
        _bgURL = @"";
        [self setTint:newGrey];
    }];
    

}

- (UIColor *)averageColor:(UIImage*) img {
    
    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
    unsigned char rgba[4];
    CGContextRef context = CGBitmapContextCreate(rgba, 1, 1, 8, 4, colorSpace, kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big);
    
    CGContextDrawImage(context, CGRectMake(0, 0, 1, 1), img.CGImage);
    CGColorSpaceRelease(colorSpace);
    CGContextRelease(context);
    
    if(rgba[3] > 0) {
        CGFloat alpha = ((CGFloat)rgba[3])/255.0;
        CGFloat multiplier = alpha/255.0;
        return [UIColor colorWithRed:((CGFloat)rgba[0])*multiplier
                               green:((CGFloat)rgba[1])*multiplier
                                blue:((CGFloat)rgba[2])*multiplier
                               alpha:alpha];
    }
    else {
        return [UIColor colorWithRed:((CGFloat)rgba[0])/255.0
                               green:((CGFloat)rgba[1])/255.0
                                blue:((CGFloat)rgba[2])/255.0
                               alpha:((CGFloat)rgba[3])/255.0];
    }
}

- (NSString*)colorToWeb:(UIColor*)color
{
    NSString *webColor = nil;
    
    // This method only works for RGB colors
    if (color &&
        CGColorGetNumberOfComponents(color.CGColor) == 4)
    {
        // Get the red, green and blue components
        const CGFloat *components = CGColorGetComponents(color.CGColor);
        
        // These components range from 0.0 till 1.0 and need to be converted to 0 till 255
        CGFloat red, green, blue;
        red = roundf(components[0] * 255.0);
        green = roundf(components[1] * 255.0);
        blue = roundf(components[2] * 255.0);
        
        // Convert with %02x (use 02 to always get two chars)
        webColor = [[NSString alloc]initWithFormat:@"%02x%02x%02x", (int)red, (int)green, (int)blue];
    }
    
    return webColor;
}

- (void)showGestureView
{
    [self resizeView];
}


- (void)setVolumeSlider:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    float val = [[options objectForKey:@"value"] floatValue];
    [_volumeSlider setValue:val animated:YES];
}

-(IBAction)onNotificationEnd:(id)sender {
    clearNotificationTimer = nil;
    _navTitle.text = [NSString stringWithFormat:@"%@", _lastNavTitle];
    _navSubTitle.text = [NSString stringWithFormat:@"%@", _lastNavSubTitle];
}

-(void)showNotification:(NSArray*)arguments withDict:(NSDictionary*)options {

    _navTitle.text = [options objectForKey:@"title"];
    _navSubTitle.text = [options objectForKey:@"subtitle"];
    
    if (clearNotificationTimer) {
        [clearNotificationTimer invalidate];
        clearNotificationTimer = nil;
    }

    clearNotificationTimer = [NSTimer scheduledTimerWithTimeInterval:1.0
                                                              target:self
                                                            selector:@selector(onNotificationEnd:)
                                                            userInfo:nil
                                                             repeats:NO];


}

- (IBAction)leftNavButtonTap:(NSString*) callback
{
    NSString * jsCallBack = @"window.plugins.GestureView._onLeftNavButtonTap();";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}

- (IBAction)rightNavButtonTap:(id)sender
{
    NSString * jsCallBack = @"window.plugins.GestureView._onRightNavButtonTap();";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}

- (IBAction)powerButtonTap:(id)sender
{
    NSString * jsCallBack = @"window.plugins.GestureView._onPowerButtonTap();";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}
- (IBAction)configButtonTap:(id)sender
{
    NSString * jsCallBack = @"window.plugins.GestureView._onConfigButtonTap();";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}

- (IBAction)roomButtonTap:(id)sender
{
    NSString * jsCallBack = @"window.plugins.GestureView._onRoomButtonTap();";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}

- (IBAction)inputButtonTap:(id)sender
{
    NSString * jsCallBack = @"window.plugins.GestureView._onInputButtonTap();";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}
- (IBAction)playButtonTap:(id)sender
{
    NSString * jsCallBack = @"window.plugins.GestureView._onPlayButtonTap(false);";
    if (isPlaying) {
        isPlaying = NO;
        jsCallBack = @"window.plugins.GestureView._onPlayButtonTap(true);";
        _playButton.image = [UIImage imageNamed:@"www/img/ui/SystemMediaControl-Play@2x.png"];
    } else {
        isPlaying = YES;
        _playButton.image = [UIImage imageNamed:@"www/img/ui/SystemMediaControl-Pause@2x.png"];
        
    }
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}
- (IBAction)muteButtonTap:(id)sender
{
    NSString * jsCallBack = @"window.plugins.GestureView._onMuteButtonTap();";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}
- (IBAction)rewind:(id)sender
{
    NSString * jsCallBack = @"window.plugins.GestureView._onRewindButtonTap();";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}
- (IBAction)forward:(id)sender
{
    NSString * jsCallBack = @"window.plugins.GestureView._onForwardButtonTap();";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}

- (IBAction) volumeChanged:(UISlider *)sender {
    // NSLog(@"%.1f", [sender value]);
    NSString * jsCallBack = [NSString stringWithFormat:@"window.plugins.GestureView._onVolumeChanged(%.1f);", [sender value]];
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}

- (IBAction) seekChanged:(UISlider *)sender {
    NSString * jsCallBack = [NSString stringWithFormat:@"window.plugins.GestureView._onSeekChanged(%.1f);", [sender value]];
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}

- (CAGradientLayer*) getGradient {
    
    UIColor *colorOne = [UIColor colorWithRed:(120/255.0) green:(135/255.0) blue:(150/255.0) alpha:1.0];
    UIColor *colorTwo = [UIColor colorWithRed:(57/255.0)  green:(79/255.0)  blue:(96/255.0)  alpha:1.0];
    
    NSArray *colors = [NSArray arrayWithObjects:(id)colorOne.CGColor, colorTwo.CGColor, nil];
    NSNumber *stopOne = [NSNumber numberWithFloat:0.0];
    NSNumber *stopTwo = [NSNumber numberWithFloat:1.0];
    
    NSArray *locations = [NSArray arrayWithObjects:stopOne, stopTwo, nil];
    
    CAGradientLayer *headerLayer = [CAGradientLayer layer];
    headerLayer.colors = colors;
    headerLayer.locations = locations;
    
    return headerLayer;
    
}

@end
