//
//  	VolumeSlider.h
//  	Volume Slider Cordova Plugin
//
//  	Created by Tommy-Carlos Williams on 20/07/11.
//  	Copyright 2011 Tommy-Carlos Williams. All rights reserved.
//      MIT Licensed
//

#import <Cordova/CDVPlugin.h>

@interface VolumeSlider : CDVPlugin <UITabBarDelegate> {
	NSString* callbackId;
	UIView* mpVolumeViewParentView;
	UISlider* myVolumeView;
}

@property (nonatomic, copy) NSString* callbackId;
@property (nonatomic, retain) UIView* mpVolumeViewParentView;
@property (nonatomic, retain) UISlider* myVolumeView;

- (void)createVolumeSlider:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
- (void)showVolumeSlider:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
- (void)hideVolumeSlider:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
- (void)setVolumeSlider:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
- (IBAction) sliderValueChanged:(id)sender;
- (IBAction) sliderDragged:(id)sender;
@end
