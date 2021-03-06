//
//  GestureView.h
//  picServe
//
//  Created by JED LIPPOLD on 8/17/13.
//
//
#import <Cordova/CDVViewController.h>
#import <Cordova/CDVPlugin.h>
#import <UIKit/UIKit.h>
#import <CoreData/CoreData.h>


@interface GestureView : CDVPlugin <UIWebViewDelegate>{
    BOOL isPlaying;
    NSTimer *clearNotificationTimer;
}

extern UIColor *newGrey;

@property (nonatomic, strong) NSString *lastNavTitle;
@property (nonatomic, strong) NSString *lastNavSubTitle;
@property (nonatomic, strong) NSString *bgURL;


@property (nonatomic, strong) IBOutlet UIView *gView;

@property (nonatomic, strong) IBOutlet UINavigationBar *navbar;
@property (nonatomic, strong) UILabel* navTitle;
@property (nonatomic, strong) UILabel* navSubTitle;

@property (nonatomic, strong) IBOutlet UIBarButtonItem *closeButton;
@property (nonatomic, strong) IBOutlet UIBarButtonItem *actionButton;

@property (nonatomic, strong) IBOutlet UIImageView *bgView;
@property (nonatomic, strong) IBOutlet UIImageView *boxCover;

@property (nonatomic, strong) IBOutlet UIView *bottomView;

@property (nonatomic, strong) UISlider* volumeSlider;
@property (nonatomic, strong) UISlider* nowPlayingSlider;
@property (nonatomic, strong) UILabel* durationStart;
@property (nonatomic, strong) UILabel* durationEnd;

@property (nonatomic, strong) UILabel* title;
@property (nonatomic, strong) UILabel* subTitle;

@property (nonatomic, strong) IBOutlet UIToolbar *toolbar;
@property (nonatomic, strong) IBOutlet UIBarButtonItem *rewindButton;
@property (nonatomic, strong) IBOutlet UIBarButtonItem *playButton;
@property (nonatomic, strong) IBOutlet UIBarButtonItem *forwardButton;

@property (nonatomic, strong) IBOutlet UIToolbar *bottomBar;
@property (nonatomic, strong) IBOutlet UIBarButtonItem *powerButton;
@property (nonatomic, strong) IBOutlet UIBarButtonItem *configButton;
@property (nonatomic, strong) IBOutlet UIBarButtonItem *roomButton;
@property (nonatomic, strong) IBOutlet UIBarButtonItem *inputButton;


- (void)create:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)setOptionsForView:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)showNotification:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)setVolumeSlider:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)setStatusBar:(NSArray*)arguments withDict:(NSDictionary*)options;

@end

